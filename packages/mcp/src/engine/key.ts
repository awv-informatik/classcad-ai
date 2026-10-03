// key.ts — the local engine's key, from ClassCAD's backend.
//
// The engine starts only with a key, a licence it checks itself. The backend
// issues one for what the account's plan allows:
//   • a signed-in machine shows its sign-in (the Firebase ID token, auth.ts);
//   • on CI, a secret access token does instead (CLASSCAD_TOKEN, ccsk_…, made
//     on classcad.ch/account).
// Keys for local use name `localhost`, which the engine matches on any port, so
// the origin the MCP declares (wasm-worker.ts) is simply true.
//
// The key is kept in ~/.classcad-mcp/engine-key.json until shortly before it
// expires and renewed ahead of time; while the backend cannot be reached, a
// kept key that has not expired still starts the engine. CLASSCAD_WASM_KEY
// takes a key of one's own instead (a machine without internet, a contract).
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { authStatus, idToken } from '../auth.js'
import { KEY_URL } from '../backend.js'

export type EngineKey = {
  key: string
  exp: number
  plan: string
  // Export formats the plan includes ('*' = all); empty when unknown
  exportFormats: string[]
}

type Kept = EngineKey & { iat: number; who: string }

const FILE = process.env.CLASSCAD_KEY_FILE || join(homedir(), '.classcad-mcp', 'engine-key.json')
const DAY = 24 * 3600 * 1000

/** The backend said no: the plan or the token does not allow it. Final, unlike a backend that cannot be reached. */
export class KeyRefused extends Error {}

function readKept(): Kept | null {
  try {
    const k = JSON.parse(readFileSync(FILE, 'utf8')) as Kept
    return k && typeof k.key === 'string' && typeof k.exp === 'number' ? k : null
  } catch {
    return null
  }
}

function writeKept(k: Kept): void {
  mkdirSync(dirname(FILE), { recursive: true })
  writeFileSync(FILE, JSON.stringify(k), { mode: 0o600 })
}

/** Forgets the kept key (on sign-out). */
export function forgetEngineKey(): void {
  rmSync(FILE, { force: true })
}

/** The plan of the kept key, for gates like the export formats; null when there is none. */
export function keptPlan(): { plan: string; exportFormats: string[] } | null {
  if (process.env.CLASSCAD_WASM_KEY) return null
  const k = readKept()
  return k ? { plan: k.plan, exportFormats: k.exportFormats } : null
}

/** The key for the next engine start. */
export async function engineKey(client = '@classcad/mcp'): Promise<EngineKey> {
  const own = process.env.CLASSCAD_WASM_KEY
  if (own) return { key: own, exp: Number.MAX_SAFE_INTEGER, plan: 'own key', exportFormats: ['*'] }

  const token = process.env.CLASSCAD_TOKEN
  let who: string
  if (token) {
    who = 'token:' + createHash('sha256').update(token).digest('hex').slice(0, 16)
  } else {
    const status = await authStatus()
    if (!status.signedIn) {
      throw new KeyRefused(
        'Sign-in required: the local engine gets its key from your classcad.ch account (call `login`), or set CLASSCAD_TOKEN to a secret access token.',
      )
    }
    who = 'account:' + status.account.uid
  }

  const fetchKey = async (): Promise<Kept> => {
    const bearer = token ?? (await idToken())
    if (!bearer) throw new Error('could not get a fresh sign-in token to ask for a key')
    let res: Response
    try {
      res = await fetch(KEY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify({ appType: 'wasm', client }),
        signal: AbortSignal.timeout(15000),
      })
    } catch (err) {
      throw new Error(`the ClassCAD key service cannot be reached (${(err as Error).message})`)
    }
    const body = (await res.json().catch(() => null)) as Record<string, any> | null
    if (!res.ok || !body || typeof body.key !== 'string') {
      const message = body?.message ?? `the ClassCAD key service answered ${res.status}`
      if (res.status >= 400 && res.status < 500 && res.status !== 429) throw new KeyRefused(message)
      throw new Error(message)
    }
    const kept: Kept = {
      key: body.key,
      exp: Number(body.exp),
      plan: String(body.plan ?? ''),
      exportFormats: Array.isArray(body.exportFormats) ? body.exportFormats : [],
      iat: Date.now(),
      who,
    }
    writeKept(kept)
    return kept
  }

  const kept = readKept()
  const now = Date.now()
  if (kept && kept.who === who && kept.exp > now + 60_000) {
    const left = kept.exp - now
    const life = kept.exp - kept.iat
    // The engine checks its key at start only: renewing now readies the next start
    if (left < DAY || left < life * 0.25) fetchKey().catch(() => {})
    return kept
  }
  try {
    return await fetchKey()
  } catch (err) {
    if (!(err instanceof KeyRefused) && kept && kept.who === who && kept.exp > now) return kept
    throw err
  }
}

// What the formats are called in the plans (functions/src/plans/plans.ts in buerli-backend)
const PLAN_FORMAT: Record<string, string> = { STP: 'step', STEP: 'step', STL: 'stl', GLB: 'stl', OFB: 'ofb', JSON: 'ofb' }

/**
 * Whether the plan exports `format`. GLB counts as STL (both are triangles); JSON as OFB (the
 * model). Without a plan (a key of one's own, or no key fetched yet) nothing is refused here:
 * this gate explains the plan to people, the engine's key is what holds.
 */
export function exportAllowed(format: string): { ok: true } | { ok: false; message: string } {
  const plan = keptPlan()
  if (!plan || plan.exportFormats.length === 0 || plan.exportFormats.includes('*')) return { ok: true }
  const wanted = PLAN_FORMAT[format.toUpperCase()]
  if (!wanted || plan.exportFormats.includes(wanted)) return { ok: true }
  const label = plan.plan ? plan.plan[0].toUpperCase() + plan.plan.slice(1) : 'This plan'
  return {
    ok: false,
    message: `${label} exports ${plan.exportFormats.map(f => f.toUpperCase()).join(' and ')}. ${format.toUpperCase()} comes with Solo and up: https://classcad.ch/subscriptions`,
  }
}
