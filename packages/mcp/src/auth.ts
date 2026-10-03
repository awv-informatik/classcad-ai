// auth.ts — the MCP works for signed-in classcad.ch accounts.
//
// Sign-in is the loopback flow command-line tools use (gh, gcloud, firebase):
//
//   1. beginLogin() opens a one-shot listener on 127.0.0.1:<random port> and
//      returns https://classcad.ch/connect?port=<port>&state=<random>.
//   2. The user opens that link. classcad.ch signs them in (or up) with the
//      existing Firebase accounts: Google, GitHub, email. Already signed in,
//      it is one "Continue" click.
//   3. The site sends the browser to http://127.0.0.1:<port>/callback#state=…&token=…
//      The Firebase refresh token rides in the FRAGMENT, which never reaches
//      a server log; the callback page POSTs it to this listener (same
//      origin) and wipes it from the address bar.
//   4. The MCP exchanges the refresh token at Firebase (proof that the account
//      exists and is enabled), stores it in ~/.classcad-mcp/auth.json and
//      resolves everyone waiting in waitForLogin() — that is how the agent
//      learns "done": the `login` tool it is waiting on returns.
//
// Every later use refreshes the token at most once an hour (Firebase records
// that as the account's last refresh). A rejected token (account disabled or
// deleted, token revoked) signs the machine out; an unreachable Firebase is
// tolerated for OFFLINE_GRACE_MS after the last successful check.
import { spawn } from 'node:child_process'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { AUTH_API_KEY, AUTH_PROJECT, AUTH_URL } from './backend.js'

/** Firebase project whose accounts may use the MCP (classcad.ch accounts; see backend.ts). */
const PROJECT = AUTH_PROJECT
/** The project's public web API key (the same one classcad.ch ships). */
const API_KEY = AUTH_API_KEY
const TOKEN_URL = process.env.CLASSCAD_AUTH_TOKEN_URL || 'https://securetoken.googleapis.com/v1/token'
/** The page that signs the user in and hands the token back. */
const LOGIN_URL = AUTH_URL
/** The local engine's kept key belongs to the sign-in (engine/key.ts). */
const ENGINE_KEY_FILE = process.env.CLASSCAD_KEY_FILE || join(homedir(), '.classcad-mcp', 'engine-key.json')
const AUTH_FILE = process.env.CLASSCAD_AUTH_FILE || join(homedir(), '.classcad-mcp', 'auth.json')

const OFFLINE_GRACE_MS = 14 * 24 * 3600 * 1000
const LOGIN_TTL_MS = 15 * 60 * 1000

export type Account = { uid: string; email: string | null; name: string | null }

type Stored = Account & { refreshToken: string; project: string; verifiedAt: number }

/** The token was refused by Firebase: the sign-in is gone for good. */
class Rejected extends Error {}

// ─── storage ───────────────────────────────────────────────────────────────

function readStored(): Stored | null {
  try {
    const s = JSON.parse(readFileSync(AUTH_FILE, 'utf8')) as Stored
    return s.refreshToken && s.project === PROJECT ? s : null
  } catch {
    return null
  }
}

function writeStored(s: Stored): void {
  mkdirSync(dirname(AUTH_FILE), { recursive: true })
  writeFileSync(AUTH_FILE, JSON.stringify(s, null, 2), { mode: 0o600 })
}

// ─── verification ──────────────────────────────────────────────────────────

/** Firebase's answers for a refresh token that will never work again. */
const DEAD_TOKEN = /^(TOKEN_EXPIRED|USER_DISABLED|USER_NOT_FOUND|INVALID_REFRESH_TOKEN|MISSING_REFRESH_TOKEN|PROJECT_NUMBER_MISMATCH)\b/

/** Exchanges a refresh token at Firebase. Throws Rejected for a dead token, anything else for "unreachable/misconfigured". */
async function exchange(refreshToken: string): Promise<{ account: Account; refreshToken: string; idToken: string; expiresAt: number }> {
  const res = await fetch(`${TOKEN_URL}?key=${encodeURIComponent(API_KEY)}`, {
    method: 'POST',
    // The web API key only serves the sites it is restricted to; the MCP
    // speaks for the sign-in page's site.
    headers: { 'content-type': 'application/x-www-form-urlencoded', referer: `${new URL(LOGIN_URL).origin}/` },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    signal: AbortSignal.timeout(15000),
  })
  const body = (await res.json().catch(() => ({}))) as Record<string, any>
  const message = String(body?.error?.message ?? `HTTP ${res.status}`)
  if (DEAD_TOKEN.test(message)) throw new Rejected(message)
  if (!res.ok) throw new Error(`Firebase answered ${res.status}: ${message}`)
  const claims = JSON.parse(Buffer.from(String(body.id_token).split('.')[1] ?? '', 'base64url').toString('utf8') || '{}')
  if (claims.aud !== PROJECT) throw new Rejected(`token belongs to project "${claims.aud}", not "${PROJECT}"`)
  return {
    account: { uid: claims.user_id ?? claims.sub ?? body.user_id, email: claims.email ?? null, name: claims.name ?? null },
    refreshToken: body.refresh_token ?? refreshToken,
    idToken: String(body.id_token),
    expiresAt: Date.now() + Number(body.expires_in ?? 3600) * 1000,
  }
}

let verifiedUntil = 0
/** The ID token of the last exchange: what this machine shows a service that asks for its sign-in (idToken()). */
let shown: { uid: string; token: string; expiresAt: number } | null = null

/** Exchanges the stored token and keeps what came back: the sign-in is confirmed for another token lifetime. */
async function refresh(stored: Stored): Promise<Account> {
  const r = await exchange(stored.refreshToken)
  writeStored({ ...stored, ...r.account, refreshToken: r.refreshToken, verifiedAt: Date.now() })
  verifiedUntil = r.expiresAt - 60_000
  shown = { uid: r.account.uid, token: r.idToken, expiresAt: r.expiresAt }
  return r.account
}
let checking: Promise<AuthStatus> | null = null

export type AuthStatus = { signedIn: true; account: Account; offline?: true } | { signedIn: false; reason: string }

/** The current sign-in, checked against Firebase at most once per token lifetime. */
export function authStatus(): Promise<AuthStatus> {
  const stored = readStored()
  if (!stored) {
    verifiedUntil = 0
    return Promise.resolve({ signedIn: false, reason: 'not signed in' })
  }
  const account: Account = { uid: stored.uid, email: stored.email, name: stored.name }
  if (Date.now() < verifiedUntil) return Promise.resolve({ signedIn: true, account })
  checking ??= (async (): Promise<AuthStatus> => {
    try {
      return { signedIn: true, account: await refresh(stored) }
    } catch (err) {
      if (err instanceof Rejected) {
        rmSync(AUTH_FILE, { force: true })
        return { signedIn: false, reason: `the sign-in is no longer valid (${err.message}); sign in again` }
      }
      if (Date.now() - stored.verifiedAt < OFFLINE_GRACE_MS) return { signedIn: true, account, offline: true }
      return { signedIn: false, reason: `could not reach Firebase to confirm the sign-in (${(err as Error).message})` }
    } finally {
      checking = null
    }
  })()
  return checking
}

/**
 * This machine's sign-in, as a service outside can check it: a Firebase ID
 * token (a JWT signed by Google, good for an hour). The share relay takes a
 * session only from a machine that shows one (share/relay.ts). Null when the
 * machine is not signed in, or Firebase cannot be reached for a new token.
 */
/** `fresh`: not the one kept for the hour, for claims that changed since (a confirmed address, a new plan). */
export async function idToken(fresh = false): Promise<string | null> {
  const stored = readStored()
  if (!stored) return null
  if (!fresh && shown && shown.uid === stored.uid && Date.now() < shown.expiresAt - 60_000) return shown.token
  try {
    await refresh(stored)
    return shown?.token ?? null
  } catch (err) {
    if (err instanceof Rejected) rmSync(AUTH_FILE, { force: true })
    return null
  }
}

/** Forgets the sign-in on this machine. */
export function logout(): boolean {
  verifiedUntil = 0
  shown = null
  const had = existsSync(AUTH_FILE)
  rmSync(AUTH_FILE, { force: true })
  rmSync(ENGINE_KEY_FILE, { force: true })
  return had
}

// ─── the loopback sign-in ──────────────────────────────────────────────────

type Pending = {
  url: string
  state: string
  port: number
  server: Server
  expiresAt: number
  done: Promise<Account>
  resolve: (a: Account) => void
  reject: (e: Error) => void
}
let pending: Pending | null = null

/**
 * Starts a sign-in (or returns the one already waiting): the link the user
 * has to open. `client` names the host on the page ("Claude Code").
 */
export async function beginLogin(client?: string): Promise<{ url: string; expiresAt: number; opened: boolean }> {
  if (pending && Date.now() < pending.expiresAt) return { url: pending.url, expiresAt: pending.expiresAt, opened: false }
  client = client ? hostName(client) : client
  const state = randomBytes(24).toString('base64url')
  let resolve!: (a: Account) => void
  let reject!: (e: Error) => void
  const done = new Promise<Account>((res, rej) => ((resolve = res), (reject = rej)))
  done.catch(() => {})
  const server = createServer((req, res) => handle(req, res).catch(err => send(res, 500, { ok: false, error: String(err?.message ?? err) })))
  await new Promise<void>((res, rej) => server.once('error', rej).listen(0, '127.0.0.1', () => res()))
  const port = (server.address() as { port: number }).port
  const q = new URLSearchParams({ port: String(port), state })
  if (client) q.set('client', client)
  const p: Pending = { url: `${LOGIN_URL}?${q}`, state, port, server, expiresAt: Date.now() + LOGIN_TTL_MS, done, resolve, reject }
  pending = p
  const timer = setTimeout(() => finish(p, new Error('the sign-in link expired')), LOGIN_TTL_MS)
  timer.unref()
  server.unref()
  // Open the sign-in page right away: the user should not have to find the
  // link in the agent's output. The link is still returned as the fallback.
  return { url: p.url, expiresAt: p.expiresAt, opened: openBrowser(p.url) }

  async function handle(req: IncomingMessage, res: ServerResponse) {
    // Only this listener's own address: no DNS rebinding, no other sites.
    if (req.headers.host !== `127.0.0.1:${port}`) return send(res, 403, { ok: false, error: 'forbidden' })
    const path = new URL(req.url ?? '/', `http://127.0.0.1:${port}`).pathname
    if (req.method === 'GET' && path === '/callback') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' })
      return res.end(callbackPage(client ?? 'your agent'))
    }
    if (req.method === 'POST' && path === '/complete') {
      if (req.headers.origin !== `http://127.0.0.1:${port}`) return send(res, 403, { ok: false, error: 'forbidden' })
      const body = JSON.parse((await readBody(req)) || '{}')
      if (!sameSecret(String(body.state ?? ''), state)) return send(res, 400, { ok: false, error: 'This link does not belong to the waiting sign-in. Ask your agent for a new one.' })
      if (pending !== p) return send(res, 410, { ok: false, error: 'This sign-in is already finished.' })
      try {
        const r = await exchange(String(body.token ?? ''))
        writeStored({ ...r.account, refreshToken: r.refreshToken, project: PROJECT, verifiedAt: Date.now() })
        verifiedUntil = r.expiresAt - 60_000
        shown = { uid: r.account.uid, token: r.idToken, expiresAt: r.expiresAt }
        send(res, 200, { ok: true, email: r.account.email, name: r.account.name })
        finish(p, r.account)
      } catch (err) {
        send(res, 400, { ok: false, error: `Sign-in was refused: ${(err as Error).message}` })
      }
      return
    }
    send(res, 404, { ok: false, error: 'not found' })
  }
}

function finish(p: Pending, result: Account | Error) {
  if (pending !== p) return
  pending = null
  if (result instanceof Error) p.reject(result)
  else p.resolve(result)
  // Let the callback page's response flush, then stop listening.
  setTimeout(() => p.server.close(), 1000).unref()
}

/** The link of a sign-in that is still waiting, if any. */
export function pendingLogin(): { url: string; expiresAt: number } | null {
  return pending && Date.now() < pending.expiresAt ? { url: pending.url, expiresAt: pending.expiresAt } : null
}

/** Waits up to `ms` for the waiting sign-in. null = still waiting (or none started). */
export async function waitForLogin(ms: number): Promise<Account | null> {
  const p = pending
  if (!p) return null
  let t: NodeJS.Timeout | undefined
  const timeout = new Promise<null>(res => (t = setTimeout(() => res(null), ms)))
  try {
    return await Promise.race([p.done, timeout])
  } finally {
    clearTimeout(t)
  }
}

// ─── helpers ───────────────────────────────────────────────────────────────

/**
 * Opens `url` in the user's browser. False where there is none to open: a
 * remote shell without a display, or CLASSCAD_AUTH_NO_BROWSER=1 (tests, CI).
 */
export function openBrowser(url: string): boolean {
  if (process.env.CLASSCAD_AUTH_NO_BROWSER === '1' || process.env.CI) return false
  const linux = process.platform !== 'darwin' && process.platform !== 'win32'
  if (linux && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) return false
  const [cmd, args] =
    process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url.replace(/&/g, '^&')]] : ['xdg-open', [url]]
  try {
    const child = spawn(cmd, args as string[], { stdio: 'ignore', detached: true, windowsHide: true })
    child.on('error', () => {})
    child.unref()
    return true
  } catch {
    return false
  }
}

/** The host as people know it, from its MCP client name ("claude-code" → "Claude Code"). */
export function hostName(client: string): string {
  const known: Record<string, string> = {
    'claude-code': 'Claude Code', 'claude-ai': 'Claude', 'claude desktop': 'Claude', 'codex': 'Codex', 'codex-mcp-client': 'Codex',
    'cursor': 'Cursor', 'cursor-vscode': 'Cursor', 'visual studio code': 'VS Code', 'vscode': 'VS Code', 'windsurf': 'Windsurf', 'opencode': 'OpenCode',
  }
  return known[client.toLowerCase()] ?? client
}

function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', c => {
      data += c
      if (data.length > 64 * 1024) req.destroy(new Error('body too large'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  if (res.headersSent) return
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

/** The page classcad.ch hands the browser to: posts the fragment to this listener, then says what happened. */
function callbackPage(client: string): string {
  const who = escapeHtml(client)
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ClassCAD · connecting</title>
<style>
  :root { color-scheme: light dark; --bg: #f6f5f2; --fg: #16161a; --muted: #6b6b73; --ok: #127a3a; --bad: #b3261e; }
  @media (prefers-color-scheme: dark) { :root { --bg: #111114; --fg: #ececf0; --muted: #9a9aa3; --ok: #5bd48a; --bad: #ff8a80; } }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: var(--bg); color: var(--fg);
         font: 16px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; padding: 0 16px; }
  main { max-width: 28rem; text-align: center; }
  h1 { font-size: 1.5rem; margin: 0 0 .5rem; }
  p { margin: .25rem 0; color: var(--muted); }
  .ok { color: var(--ok); } .bad { color: var(--bad); }
</style></head>
<body><main><h1 id="t">Connecting ClassCAD …</h1><p id="m">One moment.</p></main>
<script>
(async () => {
  const t = document.getElementById('t'), m = document.getElementById('m')
  const q = new URLSearchParams(location.hash.slice(1))
  history.replaceState(null, '', location.pathname)
  try {
    const r = await fetch('/complete', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ state: q.get('state'), token: q.get('token') }) })
    const b = await r.json()
    if (!b.ok) throw new Error(b.error)
    t.textContent = 'You are signed in.'; t.className = 'ok'
    m.textContent = 'Signed in as ' + (b.email || b.name || 'your account') + '. You can close this tab and go back to ${who}.'
  } catch (e) {
    t.textContent = 'That did not work.'; t.className = 'bad'
    m.textContent = (e && e.message) || 'Ask ${who} for a new sign-in link.'
  }
})()
</script></body></html>`
}
