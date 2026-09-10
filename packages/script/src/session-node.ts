// Node/WS session — connects to a ClassCAD worker (classcad-cli) and
// implements ScriptSession. Port of the battle-tested classcad-agent harness
// client (curve-container accumulation, structure snapshots, INFO filtering).
//
// The returned session ALSO satisfies the @classcad/renderer node-client
// contract ({ execute, request, getLastGraphic, getGraphic }), so one
// connection serves scripts and renders alike.
//
// ── Emission model (per CONNECTION, suppression per SCRIPT) ──────────────────
// The engine keeps ONE CommandConfig per connection (a per-request `config`
// field is ignored). This session does NOT touch it on connect: the
// connection runs with the engine's defaults (full content, bundled), so an
// interactive app sharing the same engine session keeps receiving our
// mutations' structure and graphic through the server's broadcast.
//   • runScript() (executor) reads the config, switches to SUPPRESS_EMISSION
//     (no structure, no graphics, messages on) for the duration of ONE
//     script and restores the previous flags afterwards - a 100-command
//     script costs 100 small Results, not 100 trees + graphics.
//   • pull() → GetTree. The structure ALWAYS comes back (GetTree is an
//     explicit request, the engine ignores sendStructure for it). Inside a
//     suppressed script the pull switches sendGraphic_Kernel on around the
//     GetTree (PULL_GRAPHIC_ON) and back; outside it is a plain GetTree.
// Caches: a mutation counter makes them self-invalidating; a Result that
// carries the structure (full emission outside scripts) keeps the tree cache
// current without a pull, the complete graphic only ever comes from a pull.

import WebSocket from 'ws'
import { randomUUID } from 'node:crypto'
import type { Envelope, ScriptSession, Task } from './types.js'

const DEFAULT_URL = 'ws://0.0.0.0:9094/'
const REQUEST_TIMEOUT = 30_000

import { PULL_GRAPHIC_ON, SUPPRESS_EMISSION } from './emission.js'
// Re-exported for existing importers; the profiles live in ./emission.ts.
export { SUPPRESS_EMISSION, PULL_GRAPHIC_ON }

export interface NodeSessionOptions {
  /** Include kernel graphics in pulls (api.graphic()). @defaultValue true */
  graphics?: boolean
  /** Disable all timeouts (debugging). @defaultValue false */
  debug?: boolean
  /** Extra namespaces to expose on the script api (optional capabilities). */
  namespaces?: Record<string, unknown>
}

export interface NodeSession extends ScriptSession {
  /**
   * Raw protocol request (e.g. `request('GetTree')`). Counts as a potential
   * mutation unless `opts.track === false` marks it read-only.
   */
  request(command: string, extra?: Record<string, unknown>, opts?: { track?: boolean }): Promise<Envelope>
  /** Effective per-connection emission config of this session (server-side state). */
  getEmissionConfig(): Promise<Record<string, unknown>>
  /**
   * Merge `partial` into this session's connection config and return the
   * effective flags. runScript uses this pair to suppress payloads for one
   * script and restore them; callers changing it by hand must restore too.
   */
  setEmissionConfig(partial: Record<string, unknown>): Promise<Record<string, unknown>>
  /** Latest pulled graphic payload (renderer-client contract). */
  getLastGraphic(): { containers?: any[] } | null
  /** Latest pulled structure snapshot ({ tree, root, … }). */
  getStructure(): Record<string, any> | null
  /** Fetch structure + graphic in one round trip (forced; caches update). */
  pull(): Promise<void>
  /** Number of tracked requests since connect — cache-invalidation key. */
  readonly version: number
  close(): void
}

/** Connect to a ClassCAD worker and return a script/renderer-ready session. */
export async function connectSession(url: string = DEFAULT_URL, opts: NodeSessionOptions = {}): Promise<NodeSession> {
  const graphics = opts.graphics !== false
  const debug = opts.debug === true
  const pending = new Map<string, { resolve: (v: Envelope) => void; reject: (e: Error) => void; at: number }>()

  let lastGraphic: { containers?: any[] } | null = null
  let lastStructure: Record<string, any> | null = null
  // Cache bookkeeping: `version` bumps on every tracked request. treeVersion
  // is the version whose structure the tree cache holds (fed by every Result
  // that carries a structure snapshot - full emission - or by a pull);
  // graphicVersion the one the graphic cache holds (fed by pulls only: an
  // Execute Result under full emission carries the changed ids' graphic, not
  // the complete model). Equal to `version` → current → no round trip.
  let version = 0
  let treeVersion = -1
  let graphicVersion = -1
  // Last known sendGraphic_Kernel of the connection, learned from every
  // GetEmissionConfig/SetEmissionConfig echo. null = never asked (engine
  // default: on). Lets pull() decide without an extra round trip whether it
  // has to switch the kernel graphic on for the GetTree.
  let knownKernel: boolean | null = null

  const ws = new WebSocket(url)
  await new Promise<void>((resolve, reject) => {
    ws.on('open', () => resolve())
    ws.on('error', (e: Error) => reject(e))
    if (!debug) setTimeout(() => reject(new Error('Connection timeout')), 5000)
  })

  const send = (obj: Record<string, unknown>) => ws.send(JSON.stringify(obj))

  function handleFrame(data: WebSocket.RawData, isBinary: boolean): void {
    if (isBinary) return
    let frame: any
    try {
      frame = JSON.parse(data.toString())
    } catch {
      return
    }
    const txId = frame._transactionID_
    if (!txId) return
    const entry = pending.get(txId)
    if (!entry) return
    if (frame.command !== 'Result') return
    pending.delete(txId)

    let result = frame.result
    // Unwrap double-wrapped result envelopes.
    if (result && typeof result === 'object' && 'result' in result && Object.keys(result).length <= 3) {
      result = result.result
    }
    // Filter INFO traces (level 31).
    const messages = ((frame.messages as any[]) || []).filter(m => m.level > 31)

    // A pull (GetTree/Sync) delivers the COMPLETE graphic — replace, never
    // merge (a merge would keep containers of deleted bodies alive). Graphic
    // on other Results covers only the changed ids and is ignored here.
    const isPull = frame._from_ === 'GetTree' || frame._from_ === 'Sync'
    if (isPull && frame.graphic && (frame.graphic.containers?.length > 0 || frame.graphic.properties)) {
      lastGraphic = frame.graphic
      graphicVersion = Math.max(graphicVersion, entry.at)
    }
    // Every structure snapshot is complete (the engine sends the whole tree).
    if (frame.structure && typeof frame.structure === 'object' && !Array.isArray(frame.structure)) {
      lastStructure = frame.structure
      treeVersion = Math.max(treeVersion, entry.at)
    }

    entry.resolve({
      result,
      messages,
      maxLevel: frame.maxLevel,
      structure: frame.structure,
      graphic: frame.graphic ?? null,
    })
  }
  ws.on('message', (d: WebSocket.RawData, b: boolean) => handleFrame(d, b))

  function request(command: string, extra: Record<string, unknown> = {}, o: { track?: boolean } = {}): Promise<Envelope> {
    if (o.track !== false) version++
    const transactionID = randomUUID()
    return new Promise<Envelope>((resolve, reject) => {
      // `at`: the model version this request's Result describes.
      pending.set(transactionID, { resolve, reject, at: version })
      // No emission flags travel with a request — the engine keeps them per
      // connection (see SUPPRESS_EMISSION / setEmissionConfig).
      send({ command, commandVersion: 'v1', transactionID, ...extra })
      if (!debug) {
        setTimeout(() => {
          if (pending.has(transactionID)) {
            pending.delete(transactionID)
            reject(new Error(`Timeout (${REQUEST_TIMEOUT}ms): ${command}`))
          }
        }, REQUEST_TIMEOUT)
      }
    })
  }

  const execute = (task: Task) => request('Execute', { task: [task], options: { undoable: false } })

  // Per-connection emission config (untracked: it changes what the engine
  // SENDS, not the model). The reply carries the effective flags in `result`;
  // an engine without the commands answers without `result`. Nothing is set
  // on connect - runScript scopes the suppression to a script (emission.ts).
  const rememberKernel = (cfg: Record<string, unknown> | undefined) => {
    if (cfg && typeof cfg.sendGraphic_Kernel === 'boolean') knownKernel = cfg.sendGraphic_Kernel
    return cfg
  }
  const getEmissionConfig = async () =>
    rememberKernel((await request('GetEmissionConfig', {}, { track: false })).result as Record<string, unknown>) as Record<string, unknown>
  const setEmissionConfig = async (partial: Record<string, unknown>) =>
    rememberKernel((await request('SetEmissionConfig', { config: partial }, { track: false })).result as Record<string, unknown>) as Record<string, unknown>

  /**
   * Fill BOTH caches with one GetTree. Not tracked — it is not a mutation.
   * GetTree always returns the structure; inside a suppressed script the
   * kernel graphic is switched on around it and back to what it was.
   */
  async function pull(): Promise<void> {
    const at = version
    const toggle = graphics && knownKernel === false
    if (toggle) await setEmissionConfig(PULL_GRAPHIC_ON)
    try {
      await request('GetTree', {}, { track: false })
      // A pull is the only source of the complete graphic: whatever it
      // delivered (possibly nothing, e.g. graphics:false) is current now.
      graphicVersion = Math.max(graphicVersion, at)
    } finally {
      if (toggle) await setEmissionConfig({ sendGraphic_Kernel: false })
    }
  }
  const treeCurrent = () => treeVersion === version && lastStructure !== null
  // No null check on lastGraphic: a pull that delivered no graphic (graphics:false, empty model) is still current.
  const graphicCurrent = () => graphicVersion === version

  async function getTree(o?: { refresh?: boolean }): Promise<Record<string, any>> {
    if (o?.refresh || !treeCurrent()) await pull()
    return lastStructure?.tree ?? {}
  }

  // The engine omits brep EDGE data from graphic payloads until the graphic
  // database settings are enabled — ensure them ONCE, lazily, so scripts get
  // full geometry from api.graphic() without knowing about the setting.
  // Untracked: it changes engine settings, not the model.
  let graphicsEnsured = false
  async function ensureGraphics(): Promise<void> {
    if (graphicsEnsured) return
    graphicsEnsured = true
    try {
      await request(
        'Execute',
        {
          task: [
            {
              'v1.common.setDatabaseSettings': [
                { isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true },
              ],
            },
          ],
          options: { undoable: false },
        },
        { track: false },
      )
    } catch {
      /* older servers — proceed without edges */
    }
  }

  async function getGraphic(o?: { recalc?: boolean }): Promise<{ containers?: any[] } | null> {
    await ensureGraphics()
    // recalc is OPT-IN: it regenerates the whole model and DESTROYS
    // entity-injection bodies. The pull alone reflects the current model —
    // every command already regenerated its own feature.
    if (o?.recalc === true) {
      try {
        await execute({ 'v1.common.recalc': [{}] } as Task)
      } catch {
        /* pull below still serves the current state */
      }
    }
    if (!graphicCurrent()) await pull()
    return lastGraphic
  }

  return {
    env: 'node',
    execute,
    request,
    getTree,
    getGraphic,
    pull,
    getEmissionConfig,
    setEmissionConfig,
    getLastGraphic: () => lastGraphic,
    getStructure: () => lastStructure,
    get version() {
      return version
    },
    namespaces: opts.namespaces,
    close: () => {
      if (ws.readyState <= WebSocket.OPEN) ws.close()
    },
  }
}
