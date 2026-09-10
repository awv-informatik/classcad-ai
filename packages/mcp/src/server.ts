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
import { DAEMON_HOST, DEFAULT_DAEMON_PORT, defaultDaemonLogFile } from './daemon.js'

const WS_URL = process.env.CLASSCAD_WS_URL ?? DEFAULT_WS_URL
const DAEMON_PORT = Number(process.env.CLASSCAD_MCP_PORT ?? DEFAULT_DAEMON_PORT)
/** Full daemon base URL override (tests, unusual setups). */
const DAEMON_URL = process.env.CLASSCAD_MCP_URL ?? `http://${DAEMON_HOST}:${DAEMON_PORT}`
const SPAWN_TIMEOUT_MS = 10_000

const log = (msg: string) => process.stderr.write(`[classcad-mcp] ${msg}\n`)

type Health = {
  name?: string
  version?: string
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
async function ensureDaemon(): Promise<Health | null> {
  let h = await health()
  if (h && h.version !== VERSION) {
    // An older daemon (from a previous install) — ask it to leave when idle.
    log(`daemon ${h.version} running, this MCP is ${VERSION}: asking it to shut down`)
    try {
      const res = await fetch(`${DAEMON_URL}/shutdown`, { method: 'POST', signal: AbortSignal.timeout(1500) })
      if (res.ok) {
        for (let i = 0; i < 25 && (await health()); i++) await sleep(200)
        h = await health()
      }
    } catch {
      /* fall through: use it as is */
    }
    if (h && h.version !== VERSION) {
      log(`daemon ${h.version} still has sessions; using it (restart it later for ${VERSION})`)
      return h
    }
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

/** Forward stdio (host) ⇄ HTTP (daemon) message by message. */
async function proxyToDaemon(): Promise<void> {
  const upstream = new StreamableHTTPClientTransport(new URL(`${DAEMON_URL}/mcp`), {
    requestInit: { headers: { 'x-classcad-ws-url': WS_URL } },
  })
  const stdio = new StdioServerTransport()
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
  upstream.onmessage = m => {
    stdio.send(m).catch(err => log(`stdio send failed: ${err?.message ?? err}`))
  }
  stdio.onmessage = m => {
    upstream.send(m).catch(err => log(`daemon send failed: ${err?.message ?? err}`))
  }
  upstream.onerror = err => log(`daemon transport error: ${err.message}`)
  upstream.onclose = () => void finish('daemon closed the session')
  stdio.onclose = () => void finish('host closed stdio')
  process.on('SIGINT', () => void finish('SIGINT'))
  process.on('SIGTERM', () => void finish('SIGTERM'))
  // The SDK transport only reads stdin; it does not notice when the host closes it.
  // A host that ends our stdin (instead of killing us) must still end the daemon session.
  process.stdin.on('end', () => void finish('host closed stdin'))
  process.stdin.on('close', () => void finish('host closed stdin'))
  await upstream.start()
  await stdio.start()
}

/** Last resort: the MCP in this process, without a bridge listener. */
async function serveInProcess(): Promise<void> {
  const { server, client } = await createMcpServer({ wsUrl: WS_URL, bridge: () => null })
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
  log('no daemon available — serving in-process (no bridge listener: in-app engines cannot attach)')
  await serveInProcess()
}

main().catch(err => {
  process.stderr.write(`[classcad-mcp] FATAL: ${err?.message ?? err}\n`)
  process.exit(1)
})
