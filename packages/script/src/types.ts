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

// ── The data contract (distilled in the skill's DATA.md; depth in STRUCTURE.md/GRAPHICS.md) ──

/**
 * A structure-tree node. Tree ids are STABLE for the session — safe to store
 * and reuse. Features live under the part's `CC_EntitySet` child; a part's
 * current brep container is `solids?.[0]` and ROTATES when a feature creates
 * a new solid.
 */
export interface TreeNode {
  id: number
  /** e.g. "CC_Part" | "CC_Solid" | "CC_Sheet" | "CC_Sketch" | "CC_Box" | "CC_WorkPlane" | … */
  class: string
  name: string
  parent: number | null
  /** Structural sub-objects (NOT the feature list — features sit under CC_EntitySet). */
  children?: number[]
  /** Parameters: `members.radius?.value`; a bound param shows `expression: "ExpressionSet.NAME"`. */
  members?: Record<string, { value?: unknown; expression?: string; [key: string]: unknown }>
  /**
   * On parts: container id of the engine's latest tessellation — rotates on every
   * solid-creating feature AND on recalc. The stable tree↔graphic join is
   * `container.owner === body.id`; a current body is a CC_Solid or a CC_Sheet
   * (an open body) with `members.consumed.value === 0`.
   */
  solids?: number[]
  /** [origin, xDir, yDir, zDir] where present (instances, work csys, sketches). */
  coordinateSystem?: number[][]
  [key: string]: unknown
}

/** The structure tree: id → node. */
export type Tree = Record<string, TreeNode>

/** One face of a body — ONE MESH PER FACE (a cylinder has shell + two caps). */
export interface GraphicMesh {
  /** PAYLOAD-LOCAL id — valid only within this graphic payload (re-tessellation reassigns). */
  id: number
  material?: { color?: number[] } | null
  /** Flat world coordinates [x0,y0,z0, x1,y1,z1, …]. */
  vertices: number[]
  /** Flat per-vertex normals. */
  normals: number[]
  /** Triangle indices. */
  indices: number[]
  [key: string]: unknown
}

/**
 * A brep edge as a tessellated polyline. PAYLOAD-LOCAL id — but valid as a
 * feature reference (e.g. `part.chamfer({ references: [edge.id] })`) in the
 * SAME session state it was read from.
 */
export interface GraphicEdge {
  id: number
  /** Flat world coordinates [x0,y0,z0, …]. */
  points: number[]
  [key: string]: unknown
}

/** One renderable container — a body, solid or sheet (type 1), or a curve shape (type 2). */
export interface GraphicContainer {
  /** PAYLOAD-LOCAL container id — rotates on re-tessellation (recalc, new feature). */
  id: number
  /** The owning TREE id, for a body its CC_Solid or CC_Sheet node — the stable join between graphic and tree. */
  owner: number
  /** 1 = body (solid or sheet), 2 = curve shape. */
  type: number
  properties?: { material?: { color?: number[] } | null; [key: string]: unknown }
  meshes?: GraphicMesh[]
  edges?: GraphicEdge[]
  [key: string]: unknown
}

/** The graphic payload — the engine's tessellation of the CURRENT model, world coordinates. */
export interface Graphic {
  containers?: GraphicContainer[]
  [key: string]: unknown
}

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
  /** Shared identity for adapters addressing the same drawing. */
  executionKey?: object
  withRunScope?<T>(run: () => Promise<T>): Promise<T>
  /** Execute one ClassCAD command (task form). Never rejects for API errors — those live in the envelope. */
  execute(task: Task): Promise<Envelope>
  /** Current structure tree (id → node; ids are session-stable). `refresh: true` forces a server round-trip where applicable. */
  getTree(opts?: { refresh?: boolean }): Promise<Tree>
  /**
   * Current graphic payload (containers with meshes/edges/…), or null when none
   * exists. `recalc: false` skips the recalc-first strategy (EIF/direct-modeling
   * sessions — recalc destroys injected bodies).
   */
  getGraphic(opts?: { recalc?: boolean }): Promise<Graphic | null>
  /** Optional client capabilities injected into the script api (e.g. buerli's facade/structure/selection). */
  namespaces?: Record<string, unknown>
  /**
   * Per-connection emission config of the engine (GetEmissionConfig /
   * SetEmissionConfig). When both are present, runScript suppresses payloads
   * for the duration of a script and restores the previous flags afterwards
   * (see emission.ts). Sessions that manage suppression themselves (the
   * browser session) leave them out.
   */
  getEmissionConfig?(): Promise<Record<string, unknown>>
  setEmissionConfig?(partial: Record<string, unknown>): Promise<Record<string, unknown>>
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

export interface OperationEvent {
  phase: 'start' | 'end' | 'error'
  method: string
  name?: string
  startedAt: number
  durationMs?: number
  maxLevel?: number
  messages?: Envelope['messages']
  error?: string
}

export interface BuildApiOptions {
  /** Throw on engine ERROR envelopes; false preserves raw envelopes for diagnostics. */
  strict?: boolean
  onOperation?: (event: OperationEvent) => void

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
  signal?: AbortSignal
  /** Max captured console entries. @defaultValue 300 */
  maxLogEntries?: number
  /** Max total captured console characters. @defaultValue 16000 */
  maxLogChars?: number
  /** Max JSON size of the returned value. @defaultValue 24000 */
  maxResultChars?: number
  /**
   * Suppress structure/graphic emission on the session's connection while the
   * script runs and restore the previous flags afterwards (only when the
   * session exposes getEmissionConfig/setEmissionConfig). @defaultValue true
   */
  suppressEmission?: boolean
}

/** Outcome of a script run. Never throws — errors are reported here, with the log tail. */
export interface RunScriptResult {
  ok: boolean
  pending?: boolean
  durationMs?: number
  /** The script's return value (JSON-capped), when ok. */
  returned?: unknown
  /** Captured console output (also present on failure — printf debugging survives errors). */
  logs: string[]
  /** Error message (syntax, runtime, or timeout), when not ok. */
  error?: string
}
