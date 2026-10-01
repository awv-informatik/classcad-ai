#!/usr/bin/env node
// server.ts — the `classcad-mcp` entry point hosts spawn over stdio.
//
// It is a thin shim: it finds the ClassCAD MCP daemon on this machine (or
// starts it, detached) and forwards its host's JSON-RPC to the daemon over
// HTTP (MCP Streamable HTTP). Every tab therefore gets its own session in the
// ONE daemon process that owns the bridge listener — see daemon.ts for why.
//
// If no daemon can be reached at all (the port is held by a foreign program
// and cannot be freed), the shim serves the MCP in-process as before, minus
// the bridge listener, so a Drogon-only user is never blocked.

import { spawn } from 'node:child_process'
import { connect as tcpConnect } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { createMcpServer, DEFAULT_WS_URL, VERSION } from './mcp-server.js'
import { DAEMON_HOST, DEFAULT_DAEMON_PORT, defaultDaemonLogFile, daemonBuildStamp } from './daemon.js'
import { wasmOptionsFromEnv } from './engine/wasm.js'
import { authStatus, beginLogin, logout, waitForLogin } from './auth.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import type { EnginePolicy } from './client.js'

const WS_URL = process.env.CLASSCAD_WS_URL ?? DEFAULT_WS_URL
/** Engine policy for this tab's session: auto (worker, else local WASM) | drogon | wasm. */
const ENGINE = (process.env.CLASSCAD_ENGINE as EnginePolicy | undefined) ?? 'auto'
const WASM = wasmOptionsFromEnv()
const DAEMON_PORT = Number(process.env.CLASSCAD_MCP_PORT ?? DEFAULT_DAEMON_PORT)
/** Full daemon base URL override (tests, unusual setups). */
const DAEMON_URL = process.env.CLASSCAD_MCP_URL ?? `http://${DAEMON_HOST}:${DAEMON_PORT}`
const SPAWN_TIMEOUT_MS = 10_000

const log = (msg: string) => process.stderr.write(`[classcad-mcp] ${msg}\n`)

type Health = {
  name?: string
  version?: string
  build?: string
  draining?: boolean
  pid?: number
  sessions?: number
  bridge?: string | null
  bridgeListen?: string
  logFile?: string | null
}

async function health(): Promise<Health | null> {
  try {
    const res = await fetch(`${DAEMON_URL}/health`, { signal: AbortSignal.timeout(1500) })
    if (!res.ok) return null
    const j = (await res.json()) as Health
    return j && j.name === 'classcad-mcp' ? j : null
  } catch {
    return null
  }
}

/** True when something accepts TCP connections on the daemon port (a foreign program, if /health said no). */
function portInUse(): Promise<boolean> {
  const { hostname, port } = new URL(DAEMON_URL)
  return new Promise(resolve => {
    const sock = tcpConnect({ host: hostname, port: Number(port) }, () => {
      sock.destroy()
      resolve(true)
    })
    sock.once('error', () => resolve(false))
    sock.setTimeout(1000, () => {
      sock.destroy()
      resolve(false)
    })
  })
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** Spawns the daemon detached (survives this shim) and waits for /health. */
async function spawnDaemon(): Promise<Health | null> {
  const daemonPath = join(dirname(fileURLToPath(import.meta.url)), 'daemon.js')
  const child = spawn(process.execPath, [daemonPath], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: {
      ...process.env,
      CLASSCAD_MCP_DAEMON: '1',
      CLASSCAD_MCP_PORT: String(DAEMON_PORT),
      // The first shim's worker URL becomes the daemon default; each session
      // still names its own worker via the x-classcad-ws-url header below.
      CLASSCAD_WS_URL: WS_URL,
    },
  })
  child.unref()
  const deadline = Date.now() + SPAWN_TIMEOUT_MS
  while (Date.now() < deadline) {
    await sleep(200)
    const h = await health()
    if (h) return h
  }
  return null
}

/**
 * Finds a daemon of this version, or starts one. Returns null when neither is
 * possible (foreign program on the port) — the caller then serves in-process.
 */
/** True when the running daemon is another version or another build of this package. */
function stale(h: Health): boolean {
  if (h.version !== VERSION) return true
  const mine = daemonBuildStamp()
  if (mine === 'unknown') return false
  // No stamp at all = a daemon from before stamps existed = older.
  return !h.build || h.build !== mine
}

async function ensureDaemon(): Promise<Health | null> {
  let h = await health()
  if (h && stale(h)) {
    // An older daemon (previous install or previous build) — ask it to leave when idle.
    log(`daemon ${h.version} (build ${h.build ?? '?'}) running, this MCP is ${VERSION} (build ${daemonBuildStamp()}): asking it to shut down`)
    try {
      const res = await fetch(`${DAEMON_URL}/shutdown`, { method: 'POST', signal: AbortSignal.timeout(1500) })
      if (res.ok) {
        for (let i = 0; i < 25 && (await health()); i++) await sleep(200)
        h = await health()
      }
    } catch {
      /* fall through: use it as is */
    }
    if (h && stale(h)) {
      // Busy with other tabs. Tell it to drain (newer daemons stop taking
      // sessions and exit after the last one) and run THIS tab on the new
      // code in-process — without the bridge listener, which the old daemon
      // still holds. The next tab after the old one is gone starts a fresh daemon.
      try {
        await fetch(`${DAEMON_URL}/shutdown?drain=1`, { method: 'POST', signal: AbortSignal.timeout(1500) })
      } catch {
        /* an old daemon without drain support: it leaves when idle */
      }
      log(`daemon ${h.version} (build ${h.build ?? '?'}) still serves ${h.sessions ?? '?'} other tab(s) — this tab runs the current build in-process (no bridge listener until that daemon is gone; restart the other tabs to move them)`)
      return null
    }
  }
  if (h?.draining) {
    log('daemon is draining; this tab runs in-process')
    return null
  }
  if (h) return h
  if (await portInUse()) {
    log(`port ${DAEMON_PORT} answers but is not a classcad-mcp daemon — set CLASSCAD_MCP_PORT to a free port`)
    return null
  }
  h = await spawnDaemon()
  if (!h) {
    // Lost the race to another shim, or the port was taken meanwhile: one more look.
    h = await health()
  }
  return h
}

/** Id of the initialize request the shim replays on a new daemon; its response is not the host's. */
const REPLAY_ID = 'classcad-shim-reinitialize'

/**
 * Forward stdio (host) ⇄ HTTP (daemon) message by message.
 *
 * The daemon may go away under a live tab (`classcad-mcp stop --force`, a
 * crash). The host initialized once and will not do it again, so the shim
 * keeps the host's initialize request: when a send fails it finds or starts a
 * daemon, replays the handshake there and resends. The tab continues on a
 * fresh session (an empty drawing) instead of hanging on unanswered requests.
 */
async function proxyToDaemon(): Promise<void> {
  const stdio = new StdioServerTransport()
  let upstream!: StreamableHTTPClientTransport
  let hostInitialize: JSONRPCMessage | null = null
  const replayWaiters = new Set<() => void>()

  const connect = async (): Promise<StreamableHTTPClientTransport> => {
    const t = new StreamableHTTPClientTransport(new URL(`${DAEMON_URL}/mcp`), {
      // Per-session settings travel as loopback headers: the daemon may have
      // been started by another tab with a different configuration.
      requestInit: {
        headers: {
          'x-classcad-ws-url': WS_URL,
          'x-classcad-engine': ENGINE,
          ...(WASM ? { 'x-classcad-wasm-key': WASM.key, ...(WASM.origin ? { 'x-classcad-wasm-origin': WASM.origin } : {}) } : {}),
        },
      },
    })
    t.onmessage = m => {
      if ('id' in m && m.id === REPLAY_ID) {
        for (const resolve of replayWaiters) resolve()
        replayWaiters.clear()
        return
      }
      stdio.send(m).catch(err => log(`stdio send failed: ${err?.message ?? err}`))
    }
    t.onerror = err => log(`daemon transport error: ${err.message}`)
    t.onclose = () => {
      if (t === upstream) void finish('daemon closed the session')
    }
    await t.start()
    return t
  }

  /** New daemon session for this tab, handshake replayed. False when no daemon can be reached. */
  const reconnect = async (): Promise<boolean> => {
    const h = await ensureDaemon()
    if (!h || !hostInitialize || !('method' in hostInitialize)) return false
    const previous = upstream
    upstream = await connect()
    previous.close().catch(() => {})
    const answered = new Promise<void>(resolve => replayWaiters.add(resolve))
    await upstream.send({ ...hostInitialize, id: REPLAY_ID } as JSONRPCMessage)
    await Promise.race([answered, sleep(15_000).then(() => Promise.reject(new Error('initialize not answered')))])
    await upstream.send({ jsonrpc: '2.0', method: 'notifications/initialized' })
    log(`reconnected to daemon ${h.version} (pid ${h.pid}) — new session, previous drawing state is gone`)
    return true
  }

  const forward = async (m: JSONRPCMessage) => {
    if ('method' in m && m.method === 'initialize') hostInitialize = m
    // Before the handshake the daemon has no session to route to, and it only
    // opens one for `initialize`. Hosts do speak first: Claude Code probes with
    // `server/discover` (the stateless protocol of MCP 2026-07-28) and falls
    // back to `initialize` when that is not a known method. Answer here —
    // forwarded, the daemon's refusal would end this shim.
    if (!hostInitialize && 'method' in m) {
      if ('id' in m) {
        const reply = m.method === 'ping' ? { result: {} } : { error: { code: -32601, message: `Method not found: ${m.method}` } }
        await stdio.send({ jsonrpc: '2.0', id: m.id, ...reply } as JSONRPCMessage).catch(() => {})
      }
      return
    }
    try {
      await upstream.send(m)
      return
    } catch (err) {
      log(`daemon send failed: ${(err as Error)?.message ?? err} — reconnecting`)
    }
    try {
      if (m === hostInitialize) {
        // The daemon went away between this shim's start and the host's handshake
        // (idle exit, a restart): find or start one and open the session there.
        if (await ensureDaemon()) {
          const previous = upstream
          upstream = await connect()
          previous.close().catch(() => {})
          await upstream.send(m)
          return
        }
      } else if (hostInitialize && (await reconnect())) {
        await upstream.send(m)
        return
      }
    } catch (err) {
      log(`reconnect failed: ${(err as Error)?.message ?? err}`)
    }
    // Unrecoverable: answer the host instead of leaving the request pending, then end the tab's MCP.
    if ('method' in m && 'id' in m) {
      await stdio
        .send({ jsonrpc: '2.0', id: m.id, error: { code: -32000, message: 'ClassCAD MCP daemon unreachable — restart the MCP' } })
        .catch(() => {})
    }
    void finish('daemon unreachable')
  }

  // Serial: a reconnect must finish before the next host message goes out.
  let queue = Promise.resolve()
  stdio.onmessage = m => {
    queue = queue.then(() => forward(m))
  }

  upstream = await connect()
  let done = false
  const finish = async (why: string) => {
    if (done) return
    done = true
    log(`session ended (${why})`)
    try {
      await upstream.terminateSession()
    } catch {
      /* daemon may be gone */
    }
    try {
      await upstream.close()
    } catch {}
    try {
      await stdio.close()
    } catch {}
    process.exit(0)
  }
  stdio.onclose = () => void finish('host closed stdio')
  process.on('SIGINT', () => void finish('SIGINT'))
  process.on('SIGTERM', () => void finish('SIGTERM'))
  // The SDK transport only reads stdin; it does not notice when the host closes it.
  // A host that ends our stdin (instead of killing us) must still end the daemon session.
  process.stdin.on('end', () => void finish('host closed stdin'))
  process.stdin.on('close', () => void finish('host closed stdin'))
  await stdio.start()
}

/** Last resort: the MCP in this process, without a bridge listener. */
async function serveInProcess(): Promise<void> {
  const { server, client } = await createMcpServer({ wsUrl: WS_URL, bridge: () => null, engine: ENGINE, wasm: WASM, log })
  const shutdown = () => {
    try {
      client.close()
    } catch {}
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  process.stdin.on('end', shutdown)
  process.stdin.on('close', shutdown)
  await server.connect(new StdioServerTransport())
}

async function main(): Promise<void> {
  const h = await ensureDaemon()
  if (h) {
    log(`using daemon ${h.version} (pid ${h.pid}, ${h.sessions} session(s), bridge ${h.bridge ?? 'none'}) at ${DAEMON_URL}; daemon log: ${h.logFile ?? defaultDaemonLogFile()}`)
    if (!h.bridge)
      log(`WARNING: the daemon has no bridge listener (${h.bridgeListen ?? 'unknown'} is taken, probably by an MCP of an older build in another tab) — in-app engines cannot attach until that process is gone; the daemon retries by itself`)
    await proxyToDaemon()
    return
  }
  log('serving in-process (no bridge listener: in-app engines cannot attach; the worker and the local WASM engine work as usual)')
  await serveInProcess()
}

const USAGE = `classcad-mcp — ClassCAD MCP server (stdio). Hosts start it without arguments.

Daemon commands:
  classcad-mcp status          show the running daemon (pid, build, sessions, apps, log file)
  classcad-mcp stop            stop the daemon if no session is active
  classcad-mcp stop --force    terminate it now: EVERY connected tab loses its drawing and
                               reconnects to a fresh daemon on its next tool call

Account commands (the MCP works for signed-in classcad.ch accounts):
  classcad-mcp login           print a sign-in link and wait until it is used
  classcad-mcp whoami          show this machine's sign-in
  classcad-mcp logout          sign this machine out
`

const pidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/** Waits until the daemon neither answers /health nor has a live pid. */
async function waitGone(pid: number | undefined, ms: number): Promise<boolean> {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (!(await health()) && !(pid && pidAlive(pid))) return true
    await sleep(100)
  }
  return false
}

async function stopDaemon(force: boolean): Promise<number> {
  const h = await health()
  if (!h) {
    console.log(`no classcad-mcp daemon at ${DAEMON_URL}`)
    return 0
  }
  if (!force) {
    const res = await fetch(`${DAEMON_URL}/shutdown`, { method: 'POST', signal: AbortSignal.timeout(1500) })
    if (res.status === 409) {
      console.error(
        `daemon pid ${h.pid} has ${h.sessions} active session(s) — not stopped.\n` +
          `\`classcad-mcp stop --force\` ends them: every connected tab loses its drawing and reconnects on its next tool call.`,
      )
      return 1
    }
    if (!res.ok) {
      console.error(`daemon refused to stop: HTTP ${res.status}`)
      return 1
    }
  } else {
    if (!h.pid) {
      console.error('daemon did not report its pid — cannot force it')
      return 1
    }
    // SIGTERM runs the daemon's own shutdown: sessions closed, bridge and port released.
    process.kill(h.pid, 'SIGTERM')
  }
  if (await waitGone(h.pid, 5000)) {
    console.log(`stopped daemon pid ${h.pid}${force ? ` (${h.sessions ?? 0} session(s) ended)` : ''}`)
    return 0
  }
  if (force && h.pid) {
    process.kill(h.pid, 'SIGKILL')
    if (await waitGone(h.pid, 2000)) {
      console.log(`killed daemon pid ${h.pid} (did not exit on SIGTERM)`)
      return 0
    }
  }
  console.error(`daemon pid ${h.pid} is still running`)
  return 1
}

async function cli(command: string, args: string[]): Promise<number> {
  if (command === 'status') {
    const h = await health()
    if (!h) {
      console.log(`no classcad-mcp daemon at ${DAEMON_URL}`)
      return 1
    }
    console.log(JSON.stringify(h, null, 2))
    return 0
  }
  if (command === 'stop') return stopDaemon(args.includes('--force'))
  if (command === 'whoami' || command === 'login') {
    const status = await authStatus()
    if (status.signedIn) {
      console.log(`signed in as ${status.account.email ?? status.account.name ?? status.account.uid}${status.offline ? ' (offline, not re-checked)' : ''}`)
      return 0
    }
    if (command === 'whoami') {
      console.log(status.reason)
      return 1
    }
    const { url, opened } = await beginLogin('your agent')
    console.log(`${opened ? 'The sign-in page is open in your browser. If not, open' : 'Open'} this link to sign in:\n\n  ${url}\n\nWaiting …`)
    const account = await waitForLogin(15 * 60 * 1000).catch(() => null)
    if (!account) {
      console.error('the sign-in link expired')
      return 1
    }
    console.log(`signed in as ${account.email ?? account.name ?? account.uid}`)
    return 0
  }
  if (command === 'logout') {
    console.log(logout() ? 'signed out' : 'was not signed in')
    return 0
  }
  console.log(USAGE)
  return 0
}

const [command, ...args] = process.argv.slice(2)
if (['status', 'stop', 'login', 'logout', 'whoami', 'help', '--help'].includes(command)) {
  cli(command, args).then(
    code => process.exit(code),
    err => {
      process.stderr.write(`[classcad-mcp] ${err?.message ?? err}\n`)
      process.exit(1)
    },
  )
} else {
  main().catch(err => {
    process.stderr.write(`[classcad-mcp] FATAL: ${err?.message ?? err}\n`)
    process.exit(1)
  })
}
