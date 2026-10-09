import { PendingRequests, completeGraphic, normalizeResult, withEmissionOverride } from './session-common.js'
// Node/WS session — connects to a ClassCAD worker (classcad-cli) and
// implements ScriptSession. Port of the battle-tested classcad-agent harness
// client (structure snapshots, INFO filtering).
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

/** Requests whose Result changes neither the model nor the database settings. */
const READS = new Set(['GetTree', 'Sync', 'GetEmissionConfig', 'SetEmissionConfig'])

export interface NodeSessionOptions {
  requestTimeoutMs?: number
  connectTimeoutMs?: number
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
  const pending = new PendingRequests<Envelope>()

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
  // The graphic database settings this session needs, once set (ensureGraphics);
  // dropped when another participant's command may have replaced them.
  let ensured: Promise<void> | null = null

  let outcomeUnknown = false
  const ws = new WebSocket(url)
  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = (error?: Error) => {
      if (timer) clearTimeout(timer)
      ws.off('open', opened); ws.off('error', failed)
      if (error) { ws.terminate(); reject(error) } else resolve()
    }
    const opened = () => finish()
    const failed = (error: Error) => finish(error)
    ws.once('open', opened); ws.once('error', failed)
    if (!debug) timer = setTimeout(() => finish(new Error('Connection timeout')), opts.connectTimeoutMs ?? 5000)
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
    if (!entry) {
      // A sibling's command (the server fans its frames out to everyone in the
      // session, the request not among them): whatever it was, the model may be
      // another one now, and so may the database settings.
      if (frame.command === 'Result' && !READS.has(frame._from_)) {
        version++
        ensured = null
      }
      return
    }
    if (frame.command !== 'Result') return
    pending.delete(txId)

    // A pull (GetTree/Sync) delivers the COMPLETE graphic — replace, never
    // merge (a merge would keep containers of deleted bodies alive). Graphic
    // on other Results covers only the changed ids and is ignored here.
    const complete = completeGraphic(frame)
    if (complete.present) {
      lastGraphic = complete.graphic
      graphicVersion = Math.max(graphicVersion, entry.at)
    }
    // Every structure snapshot is complete (the engine sends the whole tree).
    if (frame.structure && typeof frame.structure === 'object' && !Array.isArray(frame.structure)) {
      lastStructure = frame.structure
      treeVersion = Math.max(treeVersion, entry.at)
    }

    entry.resolve(normalizeResult(frame))
  }
  ws.on('message', (d: WebSocket.RawData, b: boolean) => handleFrame(d, b))
  ws.on('error', error => pending.rejectAll(error))
  ws.on('close', () => {
    outcomeUnknown = true
    pending.rejectAll(new Error('Worker disconnected; in-flight mutation outcome unknown'))
  })


  function request(command: string, extra: Record<string, unknown> = {}, o: { track?: boolean } = {}): Promise<Envelope> {
    if (outcomeUnknown) return Promise.reject(new Error('Session outcome unknown after request timeout; reconnect before further work'))
    if (o.track !== false) version++
    const transactionID = randomUUID()
    return new Promise<Envelope>((resolve, reject) => {
      // `at`: the model version this request's Result describes.
      pending.register(transactionID, { resolve, reject, at: version }, { command, timeoutMs: debug ? undefined : opts.requestTimeoutMs ?? REQUEST_TIMEOUT, onTimeout: () => { outcomeUnknown = true } })
      // No emission flags travel with a request — the engine keeps them per
      // connection (see SUPPRESS_EMISSION / setEmissionConfig).
      try { send({ command, commandVersion: 'v1', transactionID, ...extra }) }
      catch (error) { pending.delete(transactionID); reject(error as Error) }

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
   * kernel graphic is switched on around it and back to what it was. The
   * graphic comes under the database settings scripts read (ensureGraphics).
   */
  async function pull(): Promise<void> {
    // Taken before the settings are ensured: a sibling's command that lands
    // in between (its own settings, maybe) leaves this pull stale.
    const at = version
    if (graphics) await ensureGraphics()
    const toggle = graphics && knownKernel === false
    const read = async () => {
      await request('GetTree', {}, { track: false })
      graphicVersion = Math.max(graphicVersion, at)
    }
    if (toggle) await withEmissionOverride({ getEmissionConfig, setEmissionConfig }, PULL_GRAPHIC_ON, read)
    else await read()
  }
  const treeCurrent = () => treeVersion === version && lastStructure !== null
  // No null check on lastGraphic: a pull that delivered no graphic (graphics:false, empty model) is still current.
  const graphicCurrent = () => graphicVersion === version

  async function getTree(o?: { refresh?: boolean }): Promise<Record<string, any>> {
    if (o?.refresh || !treeCurrent()) await pull()
    return lastStructure?.tree ?? {}
  }

  // The engine omits brep EDGE data from graphic payloads until the graphic
  // database settings are enabled — ensured lazily before a pull, so scripts
  // get full geometry from api.graphic() without knowing about the setting,
  // and again after anyone else in the session ran a command: an app sets its
  // own settings on every connect (doCurveTessellation off puts the edges into
  // `lines`/`arcs`), and the fan-out of its command does not say which one it
  // was. One promise, so pulls asked for at once wait for the same request.
  // Untracked: it changes engine settings, not the model.
  function ensureGraphics(): Promise<void> {
    ensured ??= request(
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
    ).then(
      () => {},
      () => {
        /* older servers — proceed without edges */
      },
    )
    return ensured
  }

  async function getGraphic(o?: { recalc?: boolean }): Promise<{ containers?: any[] } | null> {
    await ensureGraphics()
    // recalc is OPT-IN: it regenerates the whole model and DESTROYS
    // entity-injection bodies. The pull alone reflects the current model —
    // every command already regenerated its own feature.
    if (o?.recalc === true) {
      const result = await execute({ 'v1.common.recalc': [{}] })
      if ((result.maxLevel ?? 0) >= 51) throw new Error('Model regeneration failed: ' + JSON.stringify(result.messages))
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
