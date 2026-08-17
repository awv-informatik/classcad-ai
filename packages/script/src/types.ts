// Core types for @classcad/script.

/** The response envelope every ClassCAD command resolves to. */
export interface Envelope {
  result?: unknown
  messages?: Array<{ message: string; code?: number; level?: number; api?: string }>
  maxLevel?: number
  /** Environment-specific extras (the node WS client attaches `structure`/`graphic`). */
  [key: string]: unknown
}

/** A harness-style task: `{ 'v1.part.box': [{ id: 4, length: 100 }] }`. */
export type Task = Record<string, [Record<string, unknown>?]>

/**
 * The session abstraction that makes scripts universal. Implementations:
 * - Node/WS: {@link ../node!connectSession} (classcad-cli worker)
 * - Browser: buerli-ai builds one over `@buerli.io/classcad` (WASM)
 *
 * The GUARANTEED surface is `execute` + `getTree` + `getGraphic`. Everything
 * a client additionally offers (buerli's `facade`/`structure`/`selection`)
 * goes into `namespaces` and appears on the script `api` object as optional —
 * scripts that stick to the guaranteed surface run everywhere unchanged.
 */
export interface ScriptSession {
  env: 'node' | 'browser'
  /** Execute one ClassCAD command (task form). Never rejects for API errors — those live in the envelope. */
  execute(task: Task): Promise<Envelope>
  /** Current structure tree (id → node). `refresh: true` forces a server round-trip where applicable. */
  getTree(opts?: { refresh?: boolean }): Promise<Record<string, any>>
  /**
   * Current graphic payload (containers with meshes/edges/…), or null when none
   * exists. `recalc: false` skips the recalc-first strategy (EIF/direct-modeling
   * sessions — recalc destroys injected bodies).
   */
  getGraphic(opts?: { recalc?: boolean }): Promise<{ containers?: any[] } | null>
  /** Optional client capabilities injected into the script api (e.g. buerli's facade/structure/selection). */
  namespaces?: Record<string, unknown>
  close?(): void | Promise<void>
}

/** One entry of the ClassCAD method registry (`@classcad/skill/method-registry.json`). */
export interface MethodRegistryEntry {
  domain: string
  method: string
  summary?: string
  params?: Array<{ name: string; text: string }>
}
export type MethodRegistry = Record<string, MethodRegistryEntry>

export interface BuildApiOptions {
  /**
   * The v1 method registry. With it, `api.v1` is a concrete object validated
   * against the real API — typos throw immediately with suggestions. Without
   * it, `api.v1` is a permissive proxy (any name; the engine reports unknown
   * commands).
   */
  registry?: MethodRegistry
}

export interface RunScriptOptions extends BuildApiOptions {
  /** Timeout for awaited work in ms. @defaultValue 60000 (max 300000) */
  timeoutMs?: number
  /** Max captured console entries. @defaultValue 300 */
  maxLogEntries?: number
  /** Max total captured console characters. @defaultValue 16000 */
  maxLogChars?: number
  /** Max JSON size of the returned value. @defaultValue 24000 */
  maxResultChars?: number
}

/** Outcome of a script run. Never throws — errors are reported here, with the log tail. */
export interface RunScriptResult {
  ok: boolean
  /** The script's return value (JSON-capped), when ok. */
  returned?: unknown
  /** Captured console output (also present on failure — printf debugging survives errors). */
  logs: string[]
  /** Error message (syntax, runtime, or timeout), when not ok. */
  error?: string
}
