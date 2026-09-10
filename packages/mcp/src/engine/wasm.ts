// wasm.ts — the MCP's own ClassCAD engine: the published WASM build, hosted
// in a worker thread (wasm-worker.ts). No server, no browser tab: the MCP
// can model on its own wherever Node runs.
//
// What it needs:
//   • the assets of one ClassCAD release (~60 MB: glue, main module, three
//     side modules, class file, filter config), downloaded once from
//     awvstatic.com into CLASSCAD_WASM_DIR (default ~/.classcad-mcp/wasm/<version>),
//   • a ClassCAD key whose allowed origins include the origin the engine is
//     told it runs on (CLASSCAD_WASM_ORIGIN, default http://localhost:3000).
//     The buerli dev key is built in (DEV_WASM_KEY); CLASSCAD_WASM_KEY
//     overrides it. Keys and origins are managed on classcad.ch/user.
//
// One engine = one drawing = one MCP session. execute() has the same shape
// as the app bridge's engine.execute (messages + inflated binary packages),
// so the client treats both the same way.
import { Worker } from 'node:worker_threads'
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { EngineExecuteResult } from '../bridge/protocol.js'

/** The ClassCAD release the MCP hosts (the same the buerli apps load). */
export const DEFAULT_WASM_VERSION = '21.2.0'
/**
 * The buerli DEVELOPMENT key — the one published with every starter and
 * example (allowed origin http://localhost:3000). Built in so the local
 * engine works without any configuration during the experimental phase;
 * CLASSCAD_WASM_KEY overrides it.
 */
export const DEV_WASM_KEY = 'MS4xLlZZUG51VkNpOGdjQm50RXB0VkE1RnQ1ekVVazNOR1dYMk9weHlxRGJjazRSdGYwTFRPTFl5NVdjYmY4VnFOOXlWTDQ0OUNzSExTbmhQRHZpNEVidXR1WWhxRVdBUGFmTzl3UmVNN3lZb2lSMXpyY1F0SHZtWGtUT1k5V2Jlcmw2OUZReHlGK25kUGp6U3pMeHJTU1JCaEVEN0JUL0FGWGIyS2tlRjM1N2tlSUpWT2hDaFFqVjB6TnphMFBMMmVXMmhteTVFTm9JNUZsSVRwT3hFQmZSQ05FY0tlMUlYNUl6d0tIU25JNHlrb214Ujg5WFovYmNPUDd1RUhyMmNDYUE2RzU3SzVkRG53VDNDcXRPcmdqY2U1c3NCd0J6YmZ0MFBidWwrazVPcXZSR0c4cTl3Y0lhR2dCcUJJN2lkVFltNFBuSmtKQVRoV2g1U1Vjc3NtRlRVVEJXZHYxSHFjQXdaY0FFMU9uSDVCOFJ2RUtrKzZCaC9OQ2QrR21SSzFlbjhqRjBSbENGL091cDlrS3J3TjFsVjJGcWFxV0VadVJqT282OGE5Y2JaRXZHcDJPRjUxUnEvMkt2M3grQUtwYUhuam05L2xBdGdpR1dGRFdJRkw4Sm1qVEhDbjhOSmdxaUpRYWhUajc0YnJPUEM3SXVrdGhBOE10b2JpbVovOXlwNS81bmdGaEVad0ZNWHJuNVN0QkpVYi81elNoMnYzN3pmSk1LVFpJMGNoWTltNDVHZDB1RHdYVUpEZ0EwZnpBNW5MQytDSTV0M2pxRlF5UDlRZktEOTZoZkl4QThEUXhEelRHdkw2UWJROWJ4NkxQTGtNaE5GdUFWbzFQdmF5eTFCNkdHQk5rQmR0OGdLeTNmSVpBL0w2TmpFYlhVcVNuam5iNng3blZISE9DdEFxU1JhZHJjdFZFTE5IZ0hMa0xpUnlMd0RyaE1WQjBCWklGemFLZmx5MEx3WWFEVVh5YnY2WVRnMFY0dkpjd1FiUnlXWDVDSW02QU5kZnlERS81MTFVbiswT1ZUaDFmQ1ZNQ1dNNmJzWTA1dTlvZGdWdWorbTBaak1EN0dlNG95MjBhVDhKR2s0aHpSUDdJWG5MYmVRZ1NxR1pDNEVPU2xhRXdmSHd5UEJmN1I5d2g3eENyeGh1Y3NGWWI5bWZzWGN1MDYrL3ppeGRaTWhPSXdDM0RoSVVVOUtHYmNwVGE4QjJ2QWJ0YVNwMngvSSsrRURsLzA5ZW1KWjRybDNtbEJ3TTJGdHJKWGdLazhBQTZkYjJtSjVaR1B0MGJ2TVdadVpCcjBmekFDU1dONThuZGpmL3BmaUc5dHdGbUVkU0xscTNESEJsczhMRFhTMzBDUlp0MFRUeUR4SWYzZWE0WHhwWFdDSUtKK1J5Qm5TK1h1SGxGbmxTbFBpRGJZeC9JNksxYzdkTXR5SVV4Wm5lSk82R0cxNlN1REpDOC90d05CK3pNUXlmaEdETjVuWnpMN0tyU1hRalFyM01NZlptOWZieHRmSEdhem04MWZkeVN2S3RoZitwSkNScWtUcnp6T2Q0RTBoazVYMmRtUEVzQXJOUktPQU9Dajd0eFB4YnEwd0tvdSs3RXdhQW56ZXovREgzb1ViNWhvOXY5ZUxWYXZXakZVWVlJdVd5eVM4dUtOd1VkVkl6OStyUUJwVkYzMGE0V0Jkam82elFwbWR1OCtYanVieG1aaXlFSCs0eCtJdnZSQ1hOY3ZEOHo4MXpsS2thZ3UzM29UbmpjWFh5bmcwQXcvV01EU1IwME1GbTlKQkQ5VjV5c3ZVeG9Nb0pQd3NHV3lKdnFpRHdPclRIZmRhajZabnNHRW5HZUQrMm5RWnU2ZFNqcE10RTdKT3F6NFJ6eXk1bW5HUmxWQklYSGkvR21Wc2ozTkIzQTVyQXlqdGNGQkFwZHlwM0MrdmVGdWN4ZS95UklQNlFUNncxK1ZXNnUv'
export const DEFAULT_WASM_ORIGIN = 'http://localhost:3000'
/** Files of one release under https://awvstatic.com/classcad/download/release/<version>/wasm/. */
export const WASM_ASSETS = ['ClassCADWasm.js', 'ClassCADWasm.wasm', 'lgs2d.wasm', 'lgs3d.wasm', 'ExpWasm.wasm', 'classcad.cfe', 'filterconfig.json']

export type LocalWasmOptions = {
  /** ClassCAD key (classcad.ch/user). Required — without it there is no local engine. */
  key: string
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

export type LocalEngine = {
  execute: (command: Record<string, unknown>) => Promise<EngineExecuteResult>
  close: () => void
  readonly version: string
  readonly origin: string
  readonly dir: string
  readonly memoryMB: number
}

/** Resolves the local engine settings from the environment (built-in dev key unless CLASSCAD_WASM_KEY is set). */
export function wasmOptionsFromEnv(env: NodeJS.ProcessEnv = process.env): LocalWasmOptions | null {
  const key = env.CLASSCAD_WASM_KEY || DEV_WASM_KEY
  if (!key) return null
  return {
    key,
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
  if (!opts.key) throw new Error('no ClassCAD key for the local WASM engine (CLASSCAD_WASM_KEY)')
  const version = opts.version ?? DEFAULT_WASM_VERSION
  const origin = opts.origin ?? DEFAULT_WASM_ORIGIN
  const log = opts.log ?? (() => {})
  const dir = await ensureWasmAssets({ version, dir: opts.dir, url: opts.url, log })

  const workerPath = join(dirname(fileURLToPath(import.meta.url)), 'wasm-worker.js')
  const worker = new Worker(workerPath)
  let memoryMB = 0
  let closed = false
  let nextId = 1
  const pending = new Map<number, { resolve: (r: EngineExecuteResult) => void; reject: (e: Error) => void }>()
  const failAll = (why: string) => {
    for (const [, p] of pending) p.reject(new Error(why))
    pending.clear()
  }
  worker.on('error', err => failAll(`WASM engine crashed: ${err.message}`))
  worker.on('exit', code => {
    closed = true
    failAll(`WASM engine exited (code ${code})`)
  })

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
        reject(new Error(`WASM engine failed to start: ${m.message}`))
      }
    }
    worker.on('message', onMessage)
    worker.once('error', err => reject(new Error(`WASM engine failed to start: ${err.message}`)))
    worker.postMessage({ type: 'init', dir, key: opts.key, origin })
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
      if (m.type === 'result') p.resolve({ messages: m.messages ?? [], binaryMessages: m.binaryMessages ?? [] })
      else p.reject(new Error(m.message))
    }
  })

  return {
    execute: command =>
      new Promise((resolve, reject) => {
        if (closed) return reject(new Error('WASM engine is closed'))
        const id = nextId++
        pending.set(id, { resolve, reject })
        worker.postMessage({ type: 'execute', id, command })
      }),
    close: () => {
      if (closed) return
      closed = true
      failAll('WASM engine closed')
      worker.terminate().catch(() => {})
    },
    version,
    origin,
    dir,
    get memoryMB() {
      return memoryMB
    },
  }
}
