// wasm.ts — the MCP's own ClassCAD engine: the published WASM build, hosted
// in a worker thread (wasm-worker.ts). No server, no browser tab: the MCP
// can model on its own wherever Node runs.
//
// What it needs:
//   • the assets of one ClassCAD release (~16 MB compressed, ~85 MB unpacked: glue, main module, three
//     side modules, class file, filter config), downloaded once from
//     awvstatic.com into CLASSCAD_WASM_DIR (default ~/.classcad-mcp/wasm/<version>),
//   • a ClassCAD key whose allowed origins include the origin the engine is
//     told it runs on (CLASSCAD_WASM_ORIGIN, default http://localhost:3000).
//     A six-month key is built in (DEV_WASM_KEY); CLASSCAD_WASM_KEY
//     overrides it. Keys and origins are managed on classcad.ch/user.
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

/** The ClassCAD release the MCP hosts (the same the buerli apps load). */
export const DEFAULT_WASM_VERSION = '21.2.0'
/**
 * The MCP's built-in key: wasm, enterprise, allowed origin http://localhost:3000,
 * valid for six months (issued 2026-09-30). Built in so the local engine needs
 * no configuration; CLASSCAD_WASM_KEY overrides it. Renew it before
 * DEV_WASM_KEY_EXPIRES with buerli-backend/functions/scripts/appkey.mjs and
 * ship a release: the engine refuses an expired key.
 */
export const DEV_WASM_KEY = 'MS4xLlZZUG51VkNpOGdjQm50RXB0VkE1RnQ1ekVVazNOR1dYMk9weHlxRGJjazRSdGYwTFRPTFl5NVdjYmY4VnFOOXlWTDQ0OUNzSExTbmhQRHZpNEVidXRubFJhZUpQVVA3aW1xZFBlWXlIcFRocFVlamVSZmJUaVM3aWcwWnlpdXNjSm5OaHFnTDhmN2EvSVRsZWxFQy9BRXJSQzZ5VUNLUC9UbFBiTTFINk10UlhNbkYwZm5QN2J0bE5DSWdWWW5RTldFSjFNcGYzaEJ4VjBjTHZlcW9tUXY0bklzVFFWSVl5T0hZVHM4ZU8vbENlaTZhdGxFbERycy9WVldoZHIwNm5DdWRvVEhTNGlmSGRWQ2FSak5QSmVNc1BmK1ZMYm5WVFI4aXl2MENadW1MbEsra2N3L0tqc0hLanZTUXJBTG5EQjcvOWpjcFhwbHlHNkFYRVppeVVESFZ0Ly9EL1VKdndMZ2E3S1ZFcFNRTStmS0xSZDR0RFYrVU41VHBrZ0wvYk5uK2huR3FHU2FtUExybXVGdXQ0T0EycHhiSlNZakZvYjFqbUZEbG5hVk1BTW11c1RqblVyQklGWGFxOUJDZnZRck13eHlGeE1RdEtCdGpnQUd5b1VSNmZmaFRXWVhpOGVtL2ZkU3hMNjFRamF4ejdLVExPS3pFOXJVMVgzcXBPQVo1NEFVenFVVzg0Zk9BeUZ0KzRMT2M0dzJMMWJ1U0YxUkZFby9CZXZ4UGRzQ3A4ZWUxMUxiTDRCQ0pFUEZJMGQyYU9JU0grN0NqOFZhVEpHb2JKVys3cktPemUyTTE4V3hOZnJMWVlhZXJzdDEwdDl1YTFja3lPdUZzRjMwdWFiejUvdGRVeENRRjhhcysxNFR2Slo4THowd1lxRkx2RTgrcG12N2VpT1ZUTzRtVSsvWXpLYkljVXFoNjNRdllkOU5jeWx3c0ZqRkZ4NGJlbGxrcHFuQjFNNHcvZVVmQ2VpNzRXT256ZGtNQzJiYWx2US9VWWJvS3ltbjZHVWtzbjZJczd0ZU5RMGs2TGovTm5mcFllcldNUXQxeEhjWnVySlZxd2hDRjBTTVRhSmhHWFNQODkwd3RFdkNRSS8zSHNYdUpseWFkWkpmZDZHRmJhNTRldEdoNUIveE80aWdNMEVuekVUMWVKa0tWMWhtbTduZjlZZzRwZmw4QnI5Z0ZZdFlPV080S2hWTjczYTB5Y0g5SlpMUUJydmlBVFowQm1uL3RNYnlKWitadmZjYzN1S2lvdXl4VC9ONlJwejlycFdrUmJvSHZSaHF4VkdjY3B4bG1nbnZudkNVaHZSZktFNTYvaDh0eEZXcXFncEo4VFR4cndFQVo3R0liRlVYVWN6TUhoQW9FV2lSWnVMTWxQck0zTVJWQkJ4YXA5a1BUeWVGaUFXU0tzZ2krUHRQbVp4ZTJldlRkekYzTEpvSkc4R25mQjZ5MVE4VWE5Q09wU3pMN05aamFpak9NRmU0dXBFaVI0andrOTUxMDVkcW9TTFExY0JoU2J0MytiNjkxcE1YYmNFZGNjU1ZYSnE5ejdubUJCeGs1THdUaURRdjdDTkQyZGNmejdKa0hXSENFcklvN2ZyMVFKU1V2dG5RRk5YUGxPNWhsTnZGVU9qWngwQkNDMGc2UDFrQUxVUEoweWtaZ3pQSnRYckdHL09XQjFUaERtTVNvMVpmdE1vbTlCdENjVGhMeGJuWDJmODlEcTNHZFE4RUd2UVV0cFRCNkVkeTdBOEE1aVNMemR1OEJhek5nYUwrclFlNk9CTko4VVEweEMzdmUrTFFoTmtVMTVzQWlycmtVdDJmL3JkMDM2bHd5d3ZnZTg2Umlvc1pnOVQ2RHVhNWRoQ1N3L0ZTQmpCOUo0QmI2Kys2TmNEOS9OTGFXNUIwUXJzdDRXYjR0cDEzL3Q3RXlxWEZiV3JLMVdiQlZtMnVhd3pzLzZ4RklR'
export const DEV_WASM_KEY_EXPIRES = '2027-03-30T09:25:07Z'
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

/** Resolves the local engine settings from the environment (the built-in key unless CLASSCAD_WASM_KEY is set). */
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
        const expired = opts.key === DEV_WASM_KEY && Date.now() > Date.parse(DEV_WASM_KEY_EXPIRES)
        const hint = expired
          ? ` The MCP's built-in engine key expired on ${DEV_WASM_KEY_EXPIRES.slice(0, 10)}: update the MCP (or set CLASSCAD_WASM_KEY).`
          : opts.key !== DEV_WASM_KEY
            ? ' Check CLASSCAD_WASM_KEY: the engine refuses an expired key or one whose allowed origins do not include ' + origin + '.'
            : ''
        reject(new Error(`WASM engine failed to start: ${m.message}.${hint}`))
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
