// Node/WS session — connects to a ClassCAD worker (classcad-cli) and
// implements ScriptSession. Port of the battle-tested classcad-agent harness
// client (curve-container accumulation, structure snapshots, INFO filtering).
//
// The returned session ALSO satisfies the @classcad/renderer node-client
// contract ({ execute, request, getLastGraphic, getGraphic }), so one
// connection serves scripts and renders alike.
//
// ── Emission model (v1, per request) ─────────────────────────────────────────
// CommandConfig is PER COMMAND on the server; a connect-time Configuration
// command has no persistent effect. So every request carries its own flags:
//   • mutations (execute) → SUPPRESS: no structure, no graphics, messages on.
//     A 100-command script costs 100 small Results, not 100 trees + graphics.
//   • pull() → one GetTree with PULL flags: full structure snapshot AND full
//     graphic bundled on that single Result. Both caches are filled by the
//     same round trip.
// A mutation counter makes the caches self-invalidating: api.tree() /
// api.graphic() only hit the server when something changed since the last
// pull — `tree(); tree()` or `tree(); graphic()` is one request, not two.

import WebSocket from 'ws'
import { randomUUID } from 'node:crypto'
import type { Envelope, ScriptSession, Task } from './types.js'

const DEFAULT_URL = 'ws://0.0.0.0:9094/'
const REQUEST_TIMEOUT = 30_000

/** Per-request flags for mutations: results only (plus messages for error handling). */
export const SUPPRESS_EMISSION: Record<string, unknown> = {
  sendStructure: false,
  sendGraphic_Kernel: false,
  sendGraphic_Sketch: false,
  sendGraphic_StructureObj: false,
  sendGraphic_Invisible: false,
  sendMessages: true,
  sendMessages_Immediately: false,
}

/** Per-request flags for the one pull: bundled snapshot + JSON graphic on the Result. */
export function pullEmission(graphics: boolean): Record<string, unknown> {
  return {
    sendStructure: true,
    sendStructure_Patch: false,
    sendStructure_Immediately: false,
    // Kernel graphics only — the content the harness/renderer contract has
    // always been built on. Sketch/structure-object/invisible categories are
    // deliberately off so renders stay identical to the previous behavior.
    sendGraphic_Kernel: graphics,
    sendGraphic_Sketch: false,
    sendGraphic_StructureObj: false,
    sendGraphic_Invisible: false,
    sendGraphic_Compressed: false,
    sendGraphic_Immediately: false,
    sendGraphic_ImmediatelyBinary: false,
    sendGraphic_Multipackage: false,
    sendMessages: true,
    sendMessages_Immediately: false,
  }
}

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
   * mutation unless `extra.config` marks it read-only via `track: false`.
   */
  request(command: string, extra?: Record<string, unknown>, opts?: { track?: boolean }): Promise<Envelope>
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
  const pending = new Map<string, { resolve: (v: Envelope) => void; reject: (e: Error) => void }>()

  let lastGraphic: { containers?: any[] } | null = null
  let lastStructure: Record<string, any> | null = null
  // Cache bookkeeping: `version` bumps on every tracked request; a pull records
  // the version it served. Equal → caches are current → no round trip.
  let version = 0
  let pulledVersion = -1

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

    // A pull delivers the COMPLETE graphic — replace, never merge (a merge
    // would keep containers of deleted bodies alive).
    if (frame.graphic && (frame.graphic.containers?.length > 0 || frame.graphic.properties)) {
      lastGraphic = frame.graphic
    }
    if (frame.structure && typeof frame.structure === 'object' && !Array.isArray(frame.structure)) {
      lastStructure = frame.structure
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
      pending.set(transactionID, { resolve, reject })
      // Suppression is the default for every request; callers pass their own
      // `config` (pull, or a script that explicitly wants payloads) to override.
      send({ command, commandVersion: 'v1', transactionID, config: SUPPRESS_EMISSION, ...extra })
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

  /** One round trip fills BOTH caches. Not tracked — it is not a mutation. */
  async function pull(): Promise<void> {
    const at = version
    await request('GetTree', { config: pullEmission(graphics) }, { track: false })
    pulledVersion = at
  }
  const isCurrent = () => pulledVersion === version && lastStructure !== null

  async function getTree(o?: { refresh?: boolean }): Promise<Record<string, any>> {
    if (o?.refresh || !isCurrent()) await pull()
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
    if (!isCurrent()) await pull()
    return lastGraphic
  }

  return {
    env: 'node',
    execute,
    request,
    getTree,
    getGraphic,
    pull,
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
