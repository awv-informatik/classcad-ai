// tools/account.ts — the `account` tool: what the signed-in classcad.ch account allows, read
// live from the plans backend with this machine's sign-in (GET /me, /domains, /tokens, /plans).
//
// It answers the questions an app needs before its first line: which plan, may it be used
// commercially, where may a web app built on it run (localhost always; registered https
// domains from the plan that has them), and the public access token that goes into the app's
// page. Read-only: tokens and domains are made by the user on classcad.ch/account.

import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { idToken } from '../auth.js'
import { AUTH_URL, KEY_URL } from '../backend.js'

const API = KEY_URL.replace(/\/key\/?$/, '')
/** The account page of the site this MCP signs in on (classcad.ch, or a develop/staging build). */
const ACCOUNT_PAGE = new URL('/account', AUTH_URL).href

type Json = Record<string, any>

/**
 * One GET to the plans backend. Plain node:http with a timer that keeps the
 * process waiting (not fetch): on Node 20 a fetch to a peer that hangs up can
 * stay unsettled forever, with AbortSignal.timeout's unref'd timer no help.
 */
function get(path: string, bearer: string, timeoutMs = 15000): Promise<{ ok: true; body: Json } | { ok: false; status: number; message: string }> {
  return new Promise(resolve => {
    const url = new URL(`${API}${path}`)
    const send = url.protocol === 'https:' ? httpsRequest : httpRequest
    const settle = (answer: { ok: true; body: Json } | { ok: false; status: number; message: string }) => {
      clearTimeout(timer)
      resolve(answer)
    }
    const unreachable = (err: Error) => settle({ ok: false, status: 0, message: `the ClassCAD account service cannot be reached (${err.message})` })
    const req = send(url, { method: 'GET', agent: false, headers: { authorization: `Bearer ${bearer}`, accept: 'application/json' } }, res => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('error', unreachable)
      res.on('end', () => {
        let body: Json | null = null
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        } catch {
          /* not JSON */
        }
        const status = res.statusCode ?? 0
        if (status >= 200 && status < 300 && body) settle({ ok: true, body })
        else settle({ ok: false, status, message: body?.message ?? res.statusMessage ?? 'no answer' })
      })
    })
    const timer = setTimeout(() => req.destroy(new Error(`no answer within ${timeoutMs / 1000} s`)), timeoutMs)
    req.on('error', unreachable)
    req.end()
  })
}

const day = (ms: unknown) => (typeof ms === 'number' ? new Date(ms).toISOString().slice(0, 10) : null)

/** The first public plan (GET /plans lists them from Free upwards) whose rights pass `has`. */
function firstPlanWith(plans: Json[] | undefined, has: (rights: Json) => boolean): string | null {
  const hit = (plans ?? []).find(p => has(p))
  return hit ? (hit.label ?? hit.id) : null
}

export function registerAccountTool(server: McpServer): void {
  server.registerTool(
    'account',
    {
      title: 'ClassCAD account and plan',
      description:
        'The signed-in classcad.ch account: its plan (and until when), whether it allows commercial use, which exports, ' +
        'and WHERE A WEB APP built with ClassCAD may run under it — localhost always (any port), public https domains only ' +
        'as registered on the account (from the plan that has them) — plus the public access token (ccpk_…) that goes into ' +
        'the app\'s page, or where to make one. Call it FIRST when the user wants their own app, website, configurator or ' +
        'deployment around a model; then follow docs(["recipes/buerli-app"]). Read-only: tokens and domains are made on the account page.',
      inputSchema: {},
    },
    async () => {
      const text = (o: unknown) => ({ content: [{ type: 'text' as const, text: typeof o === 'string' ? o : JSON.stringify(o, null, 1) }] })
      const bearer = await idToken(true)
      if (!bearer) return { isError: true, ...text('Sign-in required: call `login` first.') }

      const [me, domains, tokens, plans] = await Promise.all([get('/me', bearer), get('/domains', bearer), get('/tokens', bearer), get('/plans', bearer)])
      if (!me.ok) return { isError: true, ...text(`The account could not be read: ${me.message} (status ${me.status}).`) }

      const rights: Json = me.body.plan ?? {}
      const ent: Json = me.body.entitlement ?? {}
      const trial: Json = me.body.trial ?? {}
      const allPlans: Json[] | undefined = plans.ok ? plans.body.plans : undefined
      const domainPlan = firstPlanWith(allPlans, p => p.domainsPerSeat !== 0)
      const wildcardPlan = firstPlanWith(allPlans, p => p.wildcards === true)
      const nativePlan = firstPlanWith(allPlans, p => p.native === true)
      const commercialPlan = firstPlanWith(allPlans, p => p.commercial === true)

      const registered = domains.ok ? (domains.body.domains ?? []).filter((d: Json) => d.active).map((d: Json) => d.pattern as string) : []
      const domainsAllowed = rights.domainsPerSeat !== 0
      const publicTokens = tokens.ok ? (tokens.body.tokens ?? []).filter((t: Json) => t.type === 'public' && t.token) : []
      const secretTokens = tokens.ok ? (tokens.body.tokens ?? []).filter((t: Json) => t.type === 'secret').length : null
      const verified = me.body.emailVerified !== false

      const hosting = domainsAllowed
        ? registered.length
          ? `A web app may run on localhost (any port) and on these registered domains: ${registered.join(', ')}.`
          : `A web app may run on localhost (any port). Public https domains: none registered yet — add them under Domains on ${ACCOUNT_PAGE}` +
            (domains.ok && domains.body.limit != null ? ` (up to ${domains.body.limit})` : '') + '.'
        : `${rights.label ?? rights.id} runs a web app on localhost only (any port, http or https).` +
          (domainPlan ? ` Public domains come with ${domainPlan}.` : '')

      return text({
        email: me.body.email,
        plan: {
          id: rights.id,
          label: rights.label,
          source: ent.source ?? null, // subscription | trial | team | contract | role | free
          until: day(ent.until) ?? (ent.source === 'trial' ? day(trial.endsAt) : null),
          commercial: rights.commercial === true,
          ...(rights.commercial === true || !commercialPlan ? {} : { commercialWith: commercialPlan }),
        },
        app: {
          hosting,
          runsOn: ['http(s)://localhost:<any port>', 'http(s)://127.0.0.1:<any port>', ...registered],
          domains: domains.ok
            ? { allowed: domains.body.allowed === true, limit: domains.body.limit ?? null, wildcards: domains.body.wildcards === true, registered, ...(domains.body.wildcards || !wildcardPlan ? {} : { wildcardsWith: wildcardPlan }) }
            : { unavailable: domains.message },
          engine: 'WASM in the browser, files from ClassCAD\'s CDN' + (rights.native ? '; the native engine on own servers is included' : nativePlan ? `; the native engine on own servers comes with ${nativePlan}` : ''),
          exports: rights.exportFormats ?? [],
        },
        tokens: tokens.ok
          ? {
              public: publicTokens.map((t: Json) => ({ name: t.name, token: t.token })),
              secret: secretTokens,
              ...(publicTokens.length ? {} : { make: `${ACCOUNT_PAGE} → Access tokens → New token, kind Public → Make token` }),
            }
          : { unavailable: tokens.message, ...(verified ? {} : { reason: 'confirm the account\'s email address first' }) },
        next:
          'The PUBLIC token goes into the app\'s page (secret ccsk_ tokens never do). ' +
          'Build steps: docs(["recipes/buerli-app"]); what plans enable: docs(["PLANS"]).',
      })
    },
  )
}
