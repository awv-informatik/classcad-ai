// Browser ScriptSession — adapts the buerli client (@buerli.io/classcad WASM +
// @buerli.io/core store) to the @classcad/script session contract.
//
// Guaranteed surface (identical to the MCP/harness sessions):
//   execute    — v1 commands through createApi (the app's own client)
//   getTree    — the live structure tree from the store
//   getGraphic — the live SCG graphic containers from the store (meshes/edges/
//                vertices — scripts filter geometry themselves)
// Browser-only capabilities (facade/structure/selection/…) are injected as
// optional namespaces — scripts guard them (`if (api.facade) …`) or stay
// portable by sticking to the guaranteed surface.
//
// ── Graphic suppression during scripts (per-CONNECTION config) ───────────────
// The engine keeps ONE emission config per connection; run_script switches
// every graphic category off for the duration of the script and restores the
// app's config afterwards (BuerliCadFacade.utils.withEmissionConfig — a try/finally
// around SetEmissionConfig). Serializing the graphic on every response is what makes
// the in-browser engine slow and memory-hungry (std::bad_alloc in the response
// path); with suppression a 100-command script costs 100 small Results, and
// the graphic is pulled ONCE afterwards (fetchTree = GetTree, whose Result
// carries structure AND graphic under the restored config). Structure patches
// stay enabled throughout — they are small, and api.tree() plus the model tree
// UI remain live during the script. On engines without GetEmissionConfig/SetEmissionConfig
// (older WASM builds) withEmissionConfig runs the script with the fixed config.

import { createApi, BuerliCadFacade } from '@buerli.io/classcad'
import { getDrawing } from '@buerli.io/core'
import { liveContainers } from '../bodies'
import type { ScriptSession, Task, Envelope } from '@classcad/script'
import type { DrawingID } from '@buerli.io/core'

// Emission debug trace (console.debug — visible with "Verbose" in devtools).
// Reports what each script command cost the store: node/container counts
// before and after, so suppression and the one pull are observable.
function storeStats(drawingId: DrawingID): { nodes: number; containers: number } {
  const d = getDrawing(drawingId) as any
  return {
    nodes: Object.keys(d?.structure?.tree ?? {}).length,
    containers: Object.keys(d?.graphic?.containers ?? {}).length,
  }
}
function dbg(msg: string, data?: Record<string, unknown>): void {
  try {
    // eslint-disable-next-line no-console
    console.debug(`[buerli-ai emission] ${msg}`, data ?? '')
  } catch {
    /* logging must never break a script */
  }
}

/** Connection config for a running script: no graphic category is sent. */
export const SUPPRESS_GRAPHICS: Record<string, boolean> = {
  sendGraphic_Kernel: false,
  sendGraphic_Sketch: false,
  sendGraphic_StructureObj: false,
  sendGraphic_Invisible: false,
}
/** Connection config for one graphic pull inside a suppressed script (kernel + sketch content). */
const PULL_GRAPHICS: Record<string, boolean> = { sendGraphic_Kernel: true, sendGraphic_Sketch: true }

/**
 * Runs `fn` with a temporary per-connection emission config (restored
 * afterwards, also on error). Delegates to BuerliCadFacade.utils.withEmissionConfig;
 * on buerli builds without it, or engines without SetEmissionConfig, `fn` runs with
 * the fixed config — the pre-suppression behaviour.
 */
export async function withEmissionConfig<T>(drawingId: DrawingID, partial: Record<string, boolean>, fn: () => Promise<T>): Promise<T> {
  const facadeWithConfig = (BuerliCadFacade as any)?.utils?.withEmissionConfig
  if (typeof facadeWithConfig !== 'function') return fn()
  return facadeWithConfig(drawingId, partial, fn)
}

// The engine omits brep EDGE data from graphic payloads until the graphic
// database settings are enabled (same as the node session's lazy ensure) —
// without them, snapshots render silhouettes with no edges. Once per drawing.
const dbSettingsEnsured = new Set<string>()
async function ensureGraphicSettings(drawingId: DrawingID): Promise<void> {
  if (dbSettingsEnsured.has(String(drawingId))) return
  dbSettingsEnsured.add(String(drawingId))
  try {
    await (createApi(drawingId) as any)?.v1?.common?.setDatabaseSettings?.({ isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true })
  } catch {
    /* older engines — proceed without edges */
  }
}

// Emission debug hook (dev only): lets a devtools session read store stats and
// the facade's config helpers directly — used to verify suppression on the
// WASM transport, where no other handle exists from outside the bundle.
try {
  ;(globalThis as any).__buerliAiEmissionDebug = { storeStats, getDrawing, utils: (BuerliCadFacade as any)?.utils }
} catch {
  /* non-browser hosts */
}

/** True when the rejected value is a ClassCAD response envelope (API error), not a transport failure. */
function isEnvelope(e: unknown): e is Envelope {
  return !!e && typeof e === 'object' && ('maxLevel' in (e as object) || 'messages' in (e as object))
}

function normalizeError(prefix: string, e: unknown): Error {
  if (e instanceof Error) return e
  let detail: string
  try {
    detail = typeof e === 'string' ? e : JSON.stringify(e)
  } catch {
    detail = String(e)
  }
  return new Error(`${prefix}: ${detail}`)
}

/**
 * Refresh tree + graphic: ONE pull via fetchTree (GetTree) — its Result
 * carries the full structure AND, when the connection config allows graphics,
 * the full graphic, which the client applies to the store. After a script the
 * app's config is restored, so a plain fetchTree brings both. INSIDE a
 * suppressed script (api.graphic()) pass `graphics: true`: the pull then runs
 * under a temporary graphic-enabled config. `recalc: true` regenerates the
 * model first; it is opt-in because recalc DESTROYS entity-injection bodies
 * (EIF/solid.* sessions).
 */
export async function refreshAfterScript(drawingId: DrawingID, opts?: { recalc?: boolean; graphics?: boolean }): Promise<void> {
  const before = storeStats(drawingId)
  dbg('pull start (fetchTree)', { recalc: opts?.recalc === true, graphics: opts?.graphics === true, before })
  if (opts?.recalc === true) {
    try {
      await (createApi(drawingId) as any)?.v1?.common?.recalc?.({})
    } catch {
      /* the pull below still serves the current state */
    }
  }
  try {
    const fetchTree = () => (BuerliCadFacade as any)?.utils?.fetchTree?.(drawingId)
    if (opts?.graphics === true) await withEmissionConfig(drawingId, PULL_GRAPHICS, fetchTree)
    else await fetchTree()
  } catch {
    /* stale viewport is better than a failed script result */
  }
  dbg('pull done', { after: storeStats(drawingId) })
}

export interface BrowserSessionOptions {
  /**
   * The session runs inside a graphic-suppressed connection config (run_script
   * wraps the script in withEmissionConfig). Only affects api.graphic(): the
   * store's graphic lags behind, so a read pulls once under a temporary
   * graphic-enabled config.
   */
  suppressGraphics?: boolean
}

export interface BrowserScriptSession extends ScriptSession {
  /** True once the session executed a v1.solid.* call (recalc would destroy those bodies). */
  usedSolidApi(): boolean
}

// Drawing-level record of v1.solid.* usage — outlives the per-call session
// instances (snapshot creates a fresh session and must know whether a recalc
// would destroy injected bodies from an EARLIER script's session).
const solidApiDrawings = new Set<string>()

/** True when ANY session on this drawing executed a v1.solid.* call. */
export function drawingUsedSolidApi(drawingId: DrawingID): boolean {
  return solidApiDrawings.has(String(drawingId))
}

// Stable across store object replacements during model updates.
const executionKeys = new Map<string, object>()
function executionKey(drawingId: DrawingID): object {
  const id = String(drawingId)
  if (!executionKeys.has(id)) executionKeys.set(id, {})
  return executionKeys.get(id)!
}

/** Create a ScriptSession over the live buerli drawing. */
export function browserSession(drawingId: DrawingID, opts: BrowserSessionOptions = {}): BrowserScriptSession {
  let sawSolidCall = false
  let graphicStale = false

  async function execute(task: Task): Promise<Envelope> {
    await ensureGraphicSettings(drawingId)
    const [key, args] = Object.entries(task)[0] ?? []
    const segments = (key ?? '').split('.')
    if (segments.length !== 3 || segments[0] !== 'v1') {
      throw new Error(`Browser session executes v1 tasks only (got "${key}").`)
    }
    const [, domain, method] = segments
    if (domain === 'solid') {
      sawSolidCall = true
      solidApiDrawings.add(String(drawingId))
    }

    // The app's own client: what the engine sends back (graphic or not) is
    // decided by the CONNECTION config, which run_script sets around the whole
    // script (withEmissionConfig) — nothing per call.
    const fn = (createApi(drawingId) as any)?.v1?.[domain]?.[method]
    if (typeof fn !== 'function') {
      throw new Error(`v1.${domain}.${method} is not available on this client.`)
    }
    if (opts.suppressGraphics) graphicStale = true
    try {
      const before = storeStats(drawingId)
      const res = (await fn(args?.[0] ?? {})) as Envelope
      const after = storeStats(drawingId)
      dbg(`execute v1.${domain}.${method}`, { suppressed: !!opts.suppressGraphics, maxLevel: res?.maxLevel, before, after, graphicDelta: after.containers - before.containers })
      return res
    } catch (e: unknown) {
      // The client REJECTS on maxLevel >= error but the rejection IS the
      // response envelope — surface it like the node session does (scripts
      // read maxLevel/messages; execute only throws on transport failures).
      if (isEnvelope(e)) return e
      throw normalizeError(`v1.${domain}.${method} failed`, e)
    }
  }

  return {
    env: 'browser',
    executionKey: executionKey(drawingId),
    execute,
    getTree: async (o?: { refresh?: boolean }) => {
      if (o?.refresh) {
        try {
          await (BuerliCadFacade as any)?.utils?.fetchTree?.(drawingId)
        } catch {
          /* store copy is still served below */
        }
      }
      return ((getDrawing(drawingId) as any)?.structure?.tree ?? {}) as import('@classcad/script').Tree
    },
    getGraphic: async (o?: { recalc?: boolean }) => {
      await ensureGraphicSettings(drawingId)
      // Under suppression the store's graphic lags behind — pull once before
      // the script reads it, under a temporary graphic-enabled config (the
      // script's own config suppresses graphics, GetTree alone would bring
      // only the tree). Cached: a second graphic() without a mutation in
      // between is a no-op. recalc only when explicitly requested (and never
      // after solid.* calls — it would destroy the injected bodies).
      dbg('getGraphic', { stale: graphicStale, recalc: o?.recalc === true && !sawSolidCall })
      if (graphicStale) {
        await refreshAfterScript(drawingId, { recalc: o?.recalc === true && !sawSolidCall, graphics: true })
        graphicStale = false
      }
      const drawing = getDrawing(drawingId) as any
      const containers = drawing?.graphic?.containers
      if (!containers) return null
      // Filter out containers owned by CONSUMED bodies (solids and sheets) — the
      // store can keep superseded tool bodies around, and rendering them stacks
      // old tools on top of the current part. (Kept from the raw-client era; may
      // become unnecessary now that every call goes through buerli's own cleanup.)
      return { containers: liveContainers(Object.values(containers) as import('@classcad/script').GraphicContainer[], drawing?.structure?.tree ?? {}) }
    },
    usedSolidApi: () => sawSolidCall,
    namespaces: browserNamespaces(drawingId),
  }
}

/** Build the optional browser namespaces (facade with auto drawing id + live drawing APIs). */
function browserNamespaces(drawingId: DrawingID): Record<string, unknown> {
  const namespaces: Record<string, unknown> = {}

  const utils = (BuerliCadFacade as any)?.utils
  if (utils && typeof utils === 'object') {
    const facade: Record<string, unknown> = {}
    for (const key of Object.getOwnPropertyNames(utils)) {
      const val = utils[key]
      if (typeof val !== 'function') continue
      facade[key] = key === 'connect' ? val.bind(utils) : (...args: unknown[]) => val.call(utils, drawingId, ...args)
    }
    namespaces.facade = facade
  }

  const drawingApi = (getDrawing(drawingId) as any)?.api ?? {}
  for (const key of Object.keys(drawingApi)) {
    const val = drawingApi[key]
    if (val && typeof val === 'object' && !(key in namespaces)) namespaces[key] = val
  }
  return namespaces
}
