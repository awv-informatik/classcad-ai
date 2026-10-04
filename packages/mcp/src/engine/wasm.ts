// wasm.ts — the MCP's own ClassCAD engine: the published WASM build, hosted
// in a worker thread (wasm-worker.ts). No server, no browser tab: the MCP
// can model on its own wherever Node runs.
//
// What it needs:
//   • the assets of one ClassCAD release (~16 MB compressed, ~85 MB unpacked: glue, main module, three
//     side modules, class file, filter config), downloaded once from
//     awvstatic.com into CLASSCAD_WASM_DIR (default ~/.classcad-mcp/wasm/<version>),
//   • a ClassCAD key for the origin the engine is told it runs on
//     (http://localhost). The backend issues it for the signed-in account, or
//     for CLASSCAD_TOKEN on CI (engine/key.ts); keys for local use name
//     `localhost`, which the engine matches on any port.
//
// One engine = one drawing = one MCP session. Apps dock into that session
// through share/hub.ts, which speaks a ClassCAD server's session protocol
// for this engine.
import { Worker } from 'node:worker_threads'
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { engineKey } from './key.js'

/** The ClassCAD release the MCP hosts (the same the buerli apps load). */
export const DEFAULT_WASM_VERSION = '21.2.0'
export const DEFAULT_WASM_ORIGIN = 'http://localhost'
/** Files of one release under https://awvstatic.com/classcad/download/release/<version>/wasm/. */
export const WASM_ASSETS = ['ClassCADWasm.js', 'ClassCADWasm.wasm', 'lgs2d.wasm', 'lgs3d.wasm', 'ExpWasm.wasm', 'classcad.cfe', 'filterconfig.json']

export type LocalWasmOptions = {
  /** A ClassCAD key; without one, getKey supplies it when the engine starts. */
  key?: string
  /** The key for an engine start: from the backend (engine/key.ts). */
  getKey?: () => Promise<{ key: string; plan?: string }>
  /** Origin the engine believes it runs on; must be in the key's allowed origins. */
  origin?: string
  /** Release to host. */
  version?: string
  /** Asset directory override. */
  dir?: string
  /** Download base override (default awvstatic release/<version>/wasm). */
  url?: string
  log?: (msg: string) => void
}

/** What the engine emitted for one command: its text messages and inflated binary graphic packages, in emission order. */
export type EngineExecuteResult = {
  messages: Record<string, any>[]
  binaryMessages: Record<string, any>[]
  /** Emitted messages that could not be decoded (dropped, never thrown into the engine). */
  decodeErrors?: string[]
}

export type LocalEngine = {
  execute: (command: Record<string, unknown>) => Promise<EngineExecuteResult>
  /**
   * Health check: one GetTree must come back as a Result with a tree within
   * `timeoutMs`. False = the engine is gone or wedged — retire it (close) and
   * start a new one.
   */
  ping: (timeoutMs?: number) => Promise<boolean>
  /** `reason` is kept as deathReason. */
  close: (reason?: string) => void
  /** Closed, crashed, trapped or retired: execute() only rejects from here on. */
  readonly closed: boolean
  /** Why the engine is closed (null while it runs). */
  readonly deathReason: string | null
  readonly version: string
  readonly origin: string
  readonly dir: string
  readonly memoryMB: number
}

/** Resolves the local engine settings from the environment; the key is fetched at each engine start. */
export function wasmOptionsFromEnv(env: NodeJS.ProcessEnv = process.env): LocalWasmOptions | null {
  if (env.CLASSCAD_WASM === 'off') return null
  return {
    // A key of one's own wins; otherwise each engine start asks the backend
    key: env.CLASSCAD_WASM_KEY || undefined,
    getKey: () => engineKey(),
    origin: env.CLASSCAD_WASM_ORIGIN,
    version: env.CLASSCAD_WASM_VERSION,
    dir: env.CLASSCAD_WASM_DIR,
    url: env.CLASSCAD_WASM_URL,
  }
}

export function defaultWasmDir(version = DEFAULT_WASM_VERSION): string {
  return join(homedir(), '.classcad-mcp', 'wasm', version)
}

export function assetBaseUrl(version = DEFAULT_WASM_VERSION): string {
  return `https://awvstatic.com/classcad/download/release/${version}/wasm`
}

/** Downloads the release assets that are missing from `dir` (atomic per file). */
export async function ensureWasmAssets(opts: { version?: string; dir?: string; url?: string; log?: (m: string) => void } = {}): Promise<string> {
  const version = opts.version ?? DEFAULT_WASM_VERSION
  const dir = opts.dir ?? defaultWasmDir(version)
  const base = (opts.url ?? assetBaseUrl(version)).replace(/\/+$/, '')
  const log = opts.log ?? (() => {})
  mkdirSync(dir, { recursive: true })
  const missing = WASM_ASSETS.filter(f => !existsSync(join(dir, f)) || statSync(join(dir, f)).size === 0)
  if (missing.length === 0) return dir
  log(`downloading ClassCAD ${version} WASM assets (${missing.length} file(s)) from ${base} to ${dir}`)
  for (const name of missing) {
    const t0 = Date.now()
    const res = await fetch(`${base}/${name}`)
    if (!res.ok || !res.body) throw new Error(`download failed: ${base}/${name} → HTTP ${res.status}`)
    const part = join(dir, `${name}.part`)
    try {
      await pipeline(Readable.fromWeb(res.body as any), createWriteStream(part))
      renameSync(part, join(dir, name))
    } catch (err) {
      try {
        unlinkSync(part)
      } catch {}
      throw err
    }
    log(`  ${name}: ${Math.round(statSync(join(dir, name)).size / 1048576)} MB in ${Date.now() - t0} ms`)
  }
  return dir
}

/** Downloads (if needed) and boots one engine in its own worker thread. */
export async function startLocalEngine(opts: LocalWasmOptions): Promise<LocalEngine> {
  const fetched = opts.key ? null : opts.getKey ? await opts.getKey() : null
  const key = opts.key ?? fetched?.key
  if (!key) throw new Error('no ClassCAD key for the local WASM engine')
  const version = opts.version ?? DEFAULT_WASM_VERSION
  const origin = opts.origin ?? DEFAULT_WASM_ORIGIN
  const log = opts.log ?? (() => {})
  const dir = await ensureWasmAssets({ version, dir: opts.dir, url: opts.url, log })

  const workerPath = join(dirname(fileURLToPath(import.meta.url)), 'wasm-worker.js')
  const worker = new Worker(workerPath)
  let memoryMB = 0
  let closed = false
  let deathReason: string | null = null
  let nextId = 1
  const pending = new Map<number, { resolve: (r: EngineExecuteResult) => void; reject: (e: Error) => void }>()
  const failAll = (why: string) => {
    for (const [, p] of pending) p.reject(new Error(why))
    pending.clear()
  }
  const retire = (why: string) => {
    if (!closed) deathReason = why
    closed = true
    failAll(why)
    worker.terminate().catch(() => {})
  }
  worker.on('error', err => retire(`WASM engine crashed: ${err.message}`))
  worker.on('exit', code => retire(`WASM engine exited (code ${code})`))

  const t0 = Date.now()
  await new Promise<void>((resolve, reject) => {
    const onMessage = (m: any) => {
      if (m?.type === 'ready') {
        memoryMB = m.memoryMB
        worker.off('message', onMessage)
        log(`WASM engine ${version} ready in ${m.ms} ms (origin ${origin}, ${m.memoryMB} MB heap)`)
        resolve()
      } else if (m?.type === 'error') {
        worker.off('message', onMessage)
        // The engine refuses a bad key by exiting without a word: name the likely cause.
        const hint = process.env.CLASSCAD_WASM_KEY
          ? ' Check CLASSCAD_WASM_KEY: the engine refuses an expired key or one whose allowed origins do not include ' + origin + '.'
          : ' The engine refused its key; signing out and in again (`login` with logout, then `login`) fetches a new one.'
        reject(new Error(`WASM engine failed to start: ${m.message}.${hint}`))
      }
    }
    worker.on('message', onMessage)
    worker.once('error', err => reject(new Error(`WASM engine failed to start: ${err.message}`)))
    worker.postMessage({ type: 'init', dir, key, origin })
  }).catch(err => {
    worker.terminate().catch(() => {})
    throw err
  })
  void t0

  worker.on('message', (m: any) => {
    if (m?.type === 'result' || (m?.type === 'error' && typeof m.id === 'number')) {
      const p = pending.get(m.id)
      if (!p) return
      pending.delete(m.id)
      if (m.type === 'result') {
        p.resolve({ messages: m.messages ?? [], binaryMessages: m.binaryMessages ?? [], decodeErrors: m.decodeErrors ?? [] })
      } else if (m.fatal) {
        // The engine trapped mid-command: nothing it answers from now on can be trusted.
        const why = `WASM engine aborted (${m.message})`
        log(`${why} — retired; the next command starts a new engine with an empty drawing`)
        p.reject(new Error(`${why}. The local engine was retired and the drawing is lost; the next command starts a new engine with an empty drawing.`))
        retire(why)
      } else p.reject(new Error(m.message))
    }
  })

  const execute = (command: Record<string, unknown>) =>
    new Promise<EngineExecuteResult>((resolve, reject) => {
      if (closed) return reject(new Error(`WASM engine is closed${deathReason ? ` (${deathReason})` : ''}`))
      const id = nextId++
      pending.set(id, { resolve, reject })
      worker.postMessage({ type: 'execute', id, command })
    })

  return {
    execute,
    ping: async (timeoutMs = 10_000) => {
      if (closed) return false
      let timer: ReturnType<typeof setTimeout> | undefined
      const timeout = new Promise<null>(r => (timer = setTimeout(() => r(null), timeoutMs)))
      try {
        const res = await Promise.race([execute({ command: 'GetTree', commandVersion: 'v1', transactionID: `ping-${nextId}` }), timeout])
        const tree = res?.messages.find(m => m?.command === 'Result')
        return !!tree && ((tree.result && typeof tree.result === 'object' && 'tree' in tree.result) || !!tree.structure)
      } catch {
        return false
      } finally {
        clearTimeout(timer)
      }
    },
    close: (reason = 'WASM engine closed') => {
      if (closed) return
      retire(reason)
    },
    get closed() {
      return closed
    },
    get deathReason() {
      return deathReason
    },
    version,
    origin,
    dir,
    get memoryMB() {
      return memoryMB
    },
  }
}
