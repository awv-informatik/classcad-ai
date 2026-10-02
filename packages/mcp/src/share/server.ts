// share/server.ts — where sessions are joined on this machine: the local listener.
//
//   http://127.0.0.1:<port>/?invite=<token>     the app (Buerligons), docked into the session of that invite
//   ws://127.0.0.1:<port>/session/?invite=…     a session, joined as a guest: what a ClassCAD server's WebSocket is
//   ws://127.0.0.1:<port>/session/?host=…       a page that hosts a session of its own and offers an invite here
//   …/assets/…                                  the app's own files
//
// Two kinds of session are joined here, by the same ?invite=:
//   • the MCP's own (share/hub.ts): the engine is the MCP's, apps are guests.
//   • a page's: an app that runs the engine in its own page (buerli's
//     WASMClient) hosts its session itself, but a page cannot listen. So it
//     connects out, with ?host=<invite>, and waits. When a guest joins with
//     that invite the page is told and opens one more connection
//     (?host=<invite>&guest=<id>), which is joined to the guest's: from then on
//     the two talk to each other and this listener only passes the bytes. That
//     is how an MCP session joins the engine of a foreign app: as its guest.
//
// One listener per MCP process (the daemon, or a shim serving in-process),
// shared by all of its sessions. Every session has invites of its own: a page
// is in exactly one session, and two sessions never see each other. The
// listener binds 127.0.0.1 and answers only requests that name it as their
// host. An invite is the key to its session — the link is a secret — and the
// only one: apps of any origin may join with it, as they may join a server.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import type { Duplex } from 'node:stream'
import { WebSocketServer, type RawData, type WebSocket } from 'ws'
import { randomUUID } from 'node:crypto'
import { authStatus } from '../auth.js'
import type { SessionHub } from './hub.js'

/** The app's build, copied into the package (scripts/copy-build-assets.mjs). */
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'app')
/** The port apps look for the MCP on (DEFAULT_SESSION_URL in @buerli.io/classcad); CLASSCAD_VIEWER_PORT names another. */
const DEFAULT_PORT = 9098
/** The WebSocket path the app's build connects to (its WSCLIENT_URL). */
export const SESSION_PATH = '/session'

/** Content types of what an app build is made of. */
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}
/** Text formats: served gzipped to whoever takes it. */
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt'])

/** One file of the app, as it is served: its bytes, the same gzipped (text only), its content type. */
type Asset = { body: Buffer; gzip: Buffer | null; type: string }

/** The app's files, read once: path → bytes. Empty when this build has no app. */
let assets: Map<string, Asset> | null = null
function loadAssets(): Map<string, Asset> {
  if (assets) return assets
  assets = new Map()
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const file = join(dir, name)
      if (statSync(file).isDirectory()) walk(file)
      else {
        const body = readFileSync(file)
        const ext = extname(name)
        assets!.set(relative(APP_DIR, file).split(sep).join('/'), { body, gzip: COMPRESSIBLE.has(ext) && body.length > 1024 ? gzipSync(body) : null, type: MIME[ext] ?? 'application/octet-stream' })
      }
    }
  }
  if (existsSync(APP_DIR)) walk(APP_DIR)
  return assets
}

/** True when this build carries the app (dist/app/index.html). */
export function appAvailable(): boolean {
  return existsSync(join(APP_DIR, 'index.html'))
}

/** Invite → the hub of its session. */
const hubs = new Map<string, SessionHub>()

/** Makes an invite joinable on the listener. Returns the function that takes it off again. */
export function offerInvite(token: string, hub: SessionHub): () => void {
  hubs.set(token, hub)
  return () => void hubs.delete(token)
}

// ── Sessions a page hosts ──

/** What a guest sent before the page met it. */
type Early = Array<{ data: RawData; isBinary: boolean }>
/** A page that offers a session of its own, under one invite. */
type Page = {
  token: string
  /** The page's standing connection for this invite: it is told of guests on it. */
  control: WebSocket
  /** Guests that joined and wait for the page to meet them. */
  waiting: Map<string, { guest: WebSocket; early: Early; buffer: (data: RawData, isBinary: boolean) => void; timer: ReturnType<typeof setTimeout> }>
  /** Guests the page met, each with the page's connection for it. */
  joined: Set<[guest: WebSocket, page: WebSocket]>
}
/** Invite → the page that offers it right now. */
const pages = new Map<string, Page>()
/** Invite → who waits for a page to offer it (waitForPage). */
const pageWaiters = new Map<string, Set<() => void>>()
/** How long a page has to meet a guest that joined. */
const MEET_TIMEOUT_MS = 10_000
/** How often a page's standing connection is pinged; one that misses a beat is closed. */
const HEARTBEAT_MS = 30_000

/** True when the invite is joined on this listener: a page offers it here right now, or it is of an MCP session of this process. */
export function joinedHere(token: string): boolean {
  return pages.has(token) || hubs.has(token)
}

/** Waits until a page offers the invite (a page finds the MCP again within seconds of its start). False after `timeoutMs`. */
export function waitForPage(token: string, timeoutMs: number): Promise<boolean> {
  if (pages.has(token)) return Promise.resolve(true)
  return new Promise(resolve => {
    let set = pageWaiters.get(token)
    if (!set) pageWaiters.set(token, (set = new Set()))
    const waiters = set
    const done = () => {
      clearTimeout(timer)
      resolve(true)
    }
    const timer = setTimeout(() => {
      waiters.delete(done)
      if (!waiters.size) pageWaiters.delete(token)
      resolve(false)
    }, timeoutMs)
    waiters.add(done)
  })
}

/** Closes a WebSocket that may be closing already. */
const shut = (ws: WebSocket, code: number, reason: string) => {
  try {
    ws.close(code, reason)
  } catch {
    /* already closing */
  }
}

/** A page offers an invite: it stays joinable for as long as this connection lasts. */
function offer(token: string, control: WebSocket): void {
  const page: Page = { token, control, waiting: new Map(), joined: new Set() }
  pages.set(token, page)
  const waiters = pageWaiters.get(token)
  if (waiters) {
    pageWaiters.delete(token)
    for (const done of waiters) done()
  }
  // A page that went away without a word (a closed laptop) must not stay offered.
  let alive = true
  control.on('pong', () => (alive = true))
  const beat = setInterval(() => {
    if (!alive) return control.terminate()
    alive = false
    control.ping()
  }, HEARTBEAT_MS)
  beat.unref()
  const end = () => {
    clearInterval(beat)
    if (pages.get(token) === page) pages.delete(token)
    // The host is gone: so is its session, for everyone in it.
    for (const { guest, timer } of page.waiting.values()) {
      clearTimeout(timer)
      shut(guest, 1001, 'the session is over')
    }
    page.waiting.clear()
    for (const [guest, link] of page.joined) {
      shut(guest, 1001, 'the session is over')
      shut(link, 1001, 'the session is over')
    }
    page.joined.clear()
  }
  control.on('close', end)
  control.on('error', end)
}

/** A guest joined a page's session: the page is told, and has a moment to meet it. */
function knock(page: Page, guest: WebSocket): void {
  const id = randomUUID()
  const early: Early = []
  const buffer = (data: RawData, isBinary: boolean) => void early.push({ data, isBinary })
  guest.on('message', buffer)
  const timer = setTimeout(() => {
    page.waiting.delete(id)
    shut(guest, 1011, 'the host did not answer')
  }, MEET_TIMEOUT_MS)
  page.waiting.set(id, { guest, early, buffer, timer })
  guest.on('close', () => {
    if (page.waiting.delete(id)) clearTimeout(timer)
  })
  page.control.send(JSON.stringify({ relay: 'guest', guest: id }))
}

/** The page's connection for one guest: from here on the two talk to each other. */
function meet(page: Page, id: string, link: WebSocket): void {
  const waiting = page.waiting.get(id)
  if (!waiting) return shut(link, 1008, 'nobody is waiting')
  page.waiting.delete(id)
  clearTimeout(waiting.timer)
  const { guest, early, buffer } = waiting
  const pair: [WebSocket, WebSocket] = [guest, link]
  page.joined.add(pair)
  guest.off('message', buffer)
  for (const m of early) link.send(m.data, { binary: m.isBinary })
  guest.on('message', (data, isBinary) => {
    if (link.readyState === link.OPEN) link.send(data, { binary: isBinary })
  })
  link.on('message', (data, isBinary) => {
    if (guest.readyState === guest.OPEN) guest.send(data, { binary: isBinary })
  })
  const end = () => {
    if (!page.joined.delete(pair)) return
    shut(guest, 1000, '')
    shut(link, 1000, '')
  }
  for (const ws of pair) {
    ws.on('close', end)
    ws.on('error', end)
  }
}

/** How many apps are in a session here: docked into the MCP's own, or hosting one of theirs. */
export function dockedApps(): number {
  let n = pages.size
  for (const hub of new Set(hubs.values())) n += hub.guests
  return n
}

/** How many pages offer a session of their own here. While one does, somebody may be about to join it. */
export function offeringPages(): number {
  return pages.size
}

/** The one listener of this process, once somebody asked for it. */
let listener: Promise<{ server: Server; port: number }> | null = null
/** Every WebSocket that came in: guests, pages, and the connections pages meet their guests on. */
let sockets: WebSocketServer | null = null

/**
 * Stops the listener (the process is shutting down). Every WebSocket is ended
 * with it: a page that offers a session keeps its connection open for as long
 * as it can, and a server waits for its connections before it is closed.
 */
export async function closeListener(): Promise<void> {
  const running = listener
  listener = null
  if (!running) return
  try {
    const { server } = await running
    for (const ws of sockets?.clients ?? []) ws.terminate()
    sockets = null
    pages.clear()
    server.closeAllConnections?.()
    await new Promise<void>(resolve => server.close(() => resolve()))
  } catch {
    /* never started */
  }
}

/** Starts the listener (once per process) and returns its port. */
export function listen(): Promise<{ server: Server; port: number }> {
  listener ??= new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      try {
        handle(req, res)
      } catch (err) {
        if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
        res.end(String((err as Error)?.message ?? err))
      }
    })
    const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 * 1024 })
    sockets = wss
    server.on('upgrade', (req, socket, head) => {
      upgrade(req, socket).then(
        to => {
          if (!to) return
          wss.handleUpgrade(req, socket, head, ws => {
            if (to.as === 'guest') to.hub.join(ws, to.token)
            else if (to.as === 'visitor') knock(to.page, ws)
            else if (to.as === 'page') offer(to.token, ws)
            else meet(to.page, to.guest, ws)
          })
        },
        () => refuse(socket, 500, 'error'),
      )
    })
    const wanted = Number(process.env.CLASSCAD_VIEWER_PORT ?? DEFAULT_PORT)
    const bound = () => {
      server.unref()
      resolve({ server, port: (server.address() as { port: number }).port })
    }
    server.once('error', (err: NodeJS.ErrnoException) => {
      // Another MCP process of this machine has the port: any free one will do.
      if (err.code === 'EADDRINUSE' && wanted !== 0) {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', bound)
      } else reject(err)
    })
    server.listen(wanted, '127.0.0.1', bound)
  })
  return listener
}

/** True when the request names this listener as its host: not a page of another site reaching in by a name of its own (DNS rebinding). */
const ownHost = (req: IncomingMessage): boolean => {
  const port = req.socket.localPort ?? 0
  return req.headers.host === `127.0.0.1:${port}` || req.headers.host === `localhost:${port}`
}

/** Ends a WebSocket handshake with an HTTP status: the client sees a failed connection. */
function refuse(socket: Duplex, status: number, reason: string): void {
  socket.end(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`)
}

/** What a WebSocket that asks for /session is, once it may come in. */
type Entry =
  | { as: 'guest'; hub: SessionHub; token: string } // joins an MCP session
  | { as: 'visitor'; page: Page } // joins a page's session
  | { as: 'page'; token: string } // a page, offering an invite
  | { as: 'meeting'; page: Page; guest: string } // a page, meeting one guest

/** Decides whether a WebSocket may come in, and as what. */
async function upgrade(req: IncomingMessage, socket: Duplex): Promise<Entry | null> {
  const port = req.socket.localPort ?? 0
  if (!ownHost(req)) return refuse(socket, 403, 'Forbidden'), null
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)
  if (url.pathname.replace(/\/+$/, '') !== SESSION_PATH) return refuse(socket, 404, 'Not Found'), null

  // A page that hosts its own session: offering an invite, or meeting a guest who joined with it.
  const hosted = url.searchParams.get('host')
  if (hosted) {
    const guest = url.searchParams.get('guest')
    const page = pages.get(hosted)
    if (guest) return page?.waiting.has(guest) ? { as: 'meeting', page, guest } : (refuse(socket, 404, 'Not Found'), null)
    // An invite is offered once; the MCP's own invites are not a page's to offer.
    if (page || hubs.has(hosted) || !/^[A-Za-z0-9_-]{16,128}$/.test(hosted)) return refuse(socket, 409, 'Conflict'), null
    return { as: 'page', token: hosted }
  }

  // A guest. A server takes the invite as a query parameter (browsers) or as a header (programs).
  const header = req.headers['classcad-invite']
  const token = url.searchParams.get('invite') ?? (Array.isArray(header) ? header[0] : header) ?? ''
  const hub = hubs.get(token)
  if (hub) {
    // The engine behind the session is the signed-in machine's.
    if (!(await authStatus()).signedIn) return refuse(socket, 401, 'Unauthorized'), null
    return { as: 'guest', hub, token }
  }
  const page = pages.get(token)
  if (page) return { as: 'visitor', page }
  // Like a server: no invite, no session — the handshake just fails.
  return refuse(socket, 403, 'Forbidden'), null
}

/** On every answer: no type sniffing, and the link (it carries the invite) is never sent on as a referrer. */
const SAFE_HEADERS = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }

/** HTTP: the app's page (only with an invite) and its files. */
function handle(req: IncomingMessage, res: ServerResponse): void {
  const port = req.socket.localPort ?? 0
  // Only this listener's own address: no DNS rebinding, no other sites' pages.
  if (!ownHost(req)) return text(res, 403, 'forbidden')
  if (req.method !== 'GET' && req.method !== 'HEAD') return text(res, 405, 'method not allowed')
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)
  const path = decodeURIComponent(url.pathname)
  const files = loadAssets()

  if (path === '/' || path === '/index.html') {
    const page = files.get('index.html')
    if (!page) return text(res, 404, 'This build of the ClassCAD MCP carries no app.')
    // The app without an invite would host a session of its own, and there is none to host here.
    if (!url.searchParams.get('invite')) return text(res, 404, 'Open the link your agent gave you: it carries the invite to its session.')
    res.writeHead(200, {
      ...SAFE_HEADERS,
      'content-type': page.type,
      'cache-control': 'no-store',
      // The app's own files, and WebSockets to this listener only. Styles are set from scripts (styled-components, antd).
      'content-security-policy': `default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws://127.0.0.1:${port} ws://localhost:${port} data: blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
    })
    return void res.end(req.method === 'HEAD' ? undefined : page.body)
  }

  const asset = files.get(path.replace(/^\/+/, ''))
  if (!asset || path.endsWith('index.html')) return text(res, 404, 'not found')
  const zipped = asset.gzip && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))
  res.writeHead(200, {
    ...SAFE_HEADERS,
    'content-type': asset.type,
    // Built files carry a hash in their name: they never change.
    'cache-control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    ...(zipped ? { 'content-encoding': 'gzip', vary: 'accept-encoding' } : {}),
  })
  res.end(req.method === 'HEAD' ? undefined : zipped ? asset.gzip : asset.body)
}

/** A plain-text answer. */
function text(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { ...SAFE_HEADERS, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
  res.end(body)
}
