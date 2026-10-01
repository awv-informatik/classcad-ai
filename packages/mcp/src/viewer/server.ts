// viewer/server.ts — the live 3D view of a session, served to the user's
// browser from this machine.
//
//   http://127.0.0.1:<port>/v/<token>            the page (viewer-page/)
//   …/v/<token>/scene                            what to draw, as JSON
//   …/v/<token>/events                           server-sent events: "scene" whenever the model changed
//   …/v/<token>/export/<name>.{stp,stl,glb}      the model as a file
//   …/assets/…                                   the page's own files (three.js, the font)
//
// One listener per MCP process (the daemon, or a shim serving in-process),
// shared by all of its sessions. Each session has its own unguessable token:
// a page shows the model of exactly one session, and two sessions never see
// each other's. The listener binds 127.0.0.1 and answers only requests that
// name it as their host.
//
// The engine is read in the session's own tool queue (`load`, `exportModel`
// are queued by the caller), never in the middle of a script.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { openBrowser } from '../auth.js'
import { buildScene, sceneToGlb, type Scene } from './scene.js'

const PAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'viewer-page')
const DEFAULT_PORT = 9098

export type ViewerSource = {
  /** Structure tree and graphic of the session, read in its tool queue. null: the engine was never used. */
  load: () => Promise<{ tree: Record<string, any>; graphic: { containers?: any[] } | null } | null>
  /** The model in an engine format, read in the session's tool queue. */
  exportModel: (format: 'STP' | 'STL') => Promise<Buffer>
  /** The host as people know it ("Claude Code"), and where the engine runs. */
  host: () => string | undefined
  engine: () => string
  log?: (msg: string) => void
}

export type ViewerSession = {
  /** The link of this session's view. */
  readonly url: string
  /** The model may have changed: watchers are told, and the first model opens the view. */
  touch: () => void
  /** Opens the view in the user's browser now. False where there is no browser to open. */
  open: () => boolean
  /** The session is over: its watchers are told and the link stops working. */
  close: () => void
}

type Entry = {
  token: string
  source: ViewerSource
  scene: Scene | null
  body: Buffer | null
  version: number
  dirty: boolean
  building: Promise<void> | null
  streams: Set<ServerResponse>
  opened: boolean
}

const sessions = new Map<string, Entry>()
let listener: Promise<{ server: Server; port: number }> | null = null

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
}

/** The page's files, read once: path under /assets/ → bytes. */
let assets: Map<string, { body: Buffer; type: string }> | null = null
function loadAssets(): Map<string, { body: Buffer; type: string }> {
  if (assets) return assets
  assets = new Map()
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const file = join(dir, name)
      if (statSync(file).isDirectory()) walk(file)
      else assets!.set(relative(PAGE_DIR, file).split(sep).join('/'), { body: readFileSync(file), type: MIME[extname(name)] ?? 'application/octet-stream' })
    }
  }
  if (existsSync(PAGE_DIR)) walk(PAGE_DIR)
  return assets
}

function listen(): Promise<{ server: Server; port: number }> {
  listener ??= new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      handle(req, res).catch(err => {
        if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
        res.end(String(err?.message ?? err))
      })
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

/** A session's view. The listener starts with the first one. */
export async function openViewerSession(source: ViewerSource): Promise<ViewerSession> {
  const { port } = await listen()
  const entry: Entry = { token: randomBytes(18).toString('base64url'), source, scene: null, body: null, version: 0, dirty: true, building: null, streams: new Set(), opened: false }
  sessions.set(entry.token, entry)
  const url = `http://127.0.0.1:${port}/v/${entry.token}`
  const open = () => {
    entry.opened = true
    return process.env.CLASSCAD_VIEWER_NO_BROWSER === '1' ? false : openBrowser(url)
  }
  return {
    url,
    open,
    touch: () => {
      entry.dirty = true
      // Nobody watching and the view already offered: the next page load rebuilds.
      if (!entry.streams.size && entry.opened) return
      void rebuild(entry).then(() => {
        broadcast(entry, 'scene', { version: entry.version })
        // The first model of a session brings its view up, once.
        if (!entry.opened && entry.scene?.bodies.length) {
          entry.opened = true
          if (process.env.CLASSCAD_VIEWER_OPEN !== '0' && process.env.CLASSCAD_VIEWER_NO_BROWSER !== '1' && !entry.streams.size) openBrowser(url)
        }
      }, err => source.log?.(`viewer: ${err?.message ?? err}`))
    },
    close: () => {
      broadcast(entry, 'closed', {})
      for (const res of entry.streams) res.end()
      entry.streams.clear()
      sessions.delete(entry.token)
    },
  }
}

/** Reads the session and packs what the page draws. One build at a time per session. */
function rebuild(entry: Entry): Promise<void> {
  entry.building ??= (async () => {
    entry.dirty = false
    const state = await entry.source.load()
    const scene = buildScene(state?.tree, state?.graphic)
    entry.scene = scene
    entry.version++
    entry.body = gzipSync(JSON.stringify({ version: entry.version, host: entry.source.host() ?? null, engine: entry.source.engine(), scene }))
  })().finally(() => {
    entry.building = null
  })
  return entry.building
}

function broadcast(entry: Entry, event: string, data: unknown): void {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of entry.streams) res.write(frame)
}

const SAFE_HEADERS = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const port = (req.socket.localPort ?? 0) as number
  // Only this listener's own address: no DNS rebinding, no other sites' pages.
  if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`) return text(res, 403, 'forbidden')
  if (req.method !== 'GET' && req.method !== 'HEAD') return text(res, 405, 'method not allowed')
  const path = decodeURIComponent(new URL(req.url ?? '/', `http://127.0.0.1:${port}`).pathname)

  if (path.startsWith('/assets/')) {
    const asset = loadAssets().get(path.slice('/assets/'.length))
    if (!asset || path.endsWith('index.html')) return text(res, 404, 'not found')
    res.writeHead(200, { ...SAFE_HEADERS, 'content-type': asset.type, 'cache-control': 'no-cache' })
    return void res.end(asset.body)
  }

  const m = /^\/v\/([A-Za-z0-9_-]{16,64})(\/.*)?$/.exec(path)
  if (!m) return text(res, 404, 'not found')
  const entry = sessions.get(m[1])
  const rest = m[2] ?? ''

  if (rest === '' || rest === '/') {
    // The page is served for an ended session too: it says so itself.
    const page = loadAssets().get('index.html')
    if (!page) return text(res, 500, 'the viewer page is missing from this build')
    const nonce = randomBytes(12).toString('base64')
    res.writeHead(200, {
      ...SAFE_HEADERS,
      'content-type': page.type,
      'content-security-policy': `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'`,
    })
    return void res.end(page.body.toString('utf8').replaceAll('__NONCE__', nonce))
  }
  if (!entry) return json(res, 404, { error: 'This view has ended: its session is over.' })

  if (rest === '/scene') {
    // A build in flight may have read the model before the last change: wait for it, then look again.
    if (entry.building) await entry.building
    if (entry.dirty || !entry.body) await rebuild(entry)
    res.writeHead(200, { ...SAFE_HEADERS, 'content-type': 'application/json; charset=utf-8', 'content-encoding': 'gzip' })
    return void res.end(entry.body)
  }

  if (rest === '/events') {
    res.writeHead(200, { ...SAFE_HEADERS, 'content-type': 'text/event-stream; charset=utf-8', connection: 'keep-alive' })
    res.write(`retry: 2000\nevent: hello\ndata: ${JSON.stringify({ version: entry.version })}\n\n`)
    entry.streams.add(res)
    entry.opened = true
    const beat = setInterval(() => res.write(': still here\n\n'), 20_000)
    beat.unref()
    req.on('close', () => {
      clearInterval(beat)
      entry.streams.delete(res)
    })
    return
  }

  const file = /^\/export\/([^/]{1,80})\.(stp|step|stl|glb)$/i.exec(rest)
  if (file) {
    const ext = file[2].toLowerCase()
    let body: Buffer
    let type: string
    if (ext === 'glb') {
      if (entry.building) await entry.building
      if (entry.dirty || !entry.scene) await rebuild(entry)
      body = sceneToGlb(entry.scene!)
      type = 'model/gltf-binary'
    } else {
      body = await entry.source.exportModel(ext === 'stl' ? 'STL' : 'STP')
      type = ext === 'stl' ? 'model/stl' : 'model/step'
    }
    const name = file[1].replace(/[^A-Za-z0-9._ -]/g, '_')
    res.writeHead(200, { ...SAFE_HEADERS, 'content-type': type, 'content-length': String(body.length), 'content-disposition': `attachment; filename="${name}.${ext}"` })
    return void res.end(body)
  }

  return text(res, 404, 'not found')
}

function text(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { ...SAFE_HEADERS, 'content-type': 'text/plain; charset=utf-8' })
  res.end(body)
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { ...SAFE_HEADERS, 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}
