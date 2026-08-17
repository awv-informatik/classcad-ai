// Node/WS session — connects to a ClassCAD worker (classcad-cli) and
// implements ScriptSession. Port of the battle-tested classcad-agent harness
// client (curve-container accumulation, structure snapshots, INFO filtering).
//
// The returned session ALSO satisfies the @classcad/renderer node-client
// contract ({ execute, request, getLastGraphic }), so one connection serves
// scripts and renders alike.

import WebSocket from 'ws'
import { randomUUID } from 'node:crypto'
import type { Envelope, ScriptSession, Task } from './types.js'

const DEFAULT_URL = 'ws://0.0.0.0:9094/'
const REQUEST_TIMEOUT = 30_000

export interface NodeSessionOptions {
  /** Enable server-side graphic push. @defaultValue true */
  graphics?: boolean
  /** Disable all timeouts (debugging). @defaultValue false */
  debug?: boolean
  /** Extra namespaces to expose on the script api (optional capabilities). */
  namespaces?: Record<string, unknown>
}

export interface NodeSession extends ScriptSession {
  /** Raw protocol request (e.g. `request('GetTree')`). */
  request(command: string, extra?: Record<string, unknown>): Promise<Envelope>
  /** Latest accumulated graphic payload (renderer-client contract). */
  getLastGraphic(): { containers?: any[] } | null
  /** Latest structure snapshot ({ tree, root, … }). */
  getStructure(): Record<string, any> | null
  close(): void
}

/** Connect to a ClassCAD worker and return a script/renderer-ready session. */
export async function connectSession(url: string = DEFAULT_URL, opts: NodeSessionOptions = {}): Promise<NodeSession> {
  const graphics = opts.graphics !== false
  const debug = opts.debug === true
  const pending = new Map<string, { resolve: (v: Envelope) => void; reject: (e: Error) => void }>()

  let lastGraphic: { containers?: any[] } | null = null
  let lastStructure: Record<string, any> | null = null

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

    // Accumulate graphic: curve containers (type 2) accumulate across
    // responses (the server pushes only the FIRST curve per shape); solid
    // containers (type 1) are replaced by the latest frame that has any.
    if (frame.graphic && (frame.graphic.containers?.length > 0 || frame.graphic.properties)) {
      if (!lastGraphic) {
        lastGraphic = frame.graphic
      } else {
        const incoming: any[] = frame.graphic.containers || []
        const existing: any[] = lastGraphic.containers || []
        const curveById = new Map<number, any>()
        for (const c of existing) if (c.type === 2) curveById.set(c.id, c)
        for (const c of incoming) if (c.type === 2) curveById.set(c.id, c)
        const nonCurve = incoming.filter(c => c.type !== 2)
        const oldNonCurve = nonCurve.length > 0 ? [] : existing.filter(c => c.type !== 2)
        lastGraphic = { ...frame.graphic, containers: [...oldNonCurve, ...nonCurve, ...curveById.values()] }
      }
    }
    // Structure snapshots ride along on every Result — cache defensively.
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

  // Mandatory Configuration (enables server push).
  send({
    command: 'Configuration',
    commandVersion: 'v1',
    config: {
      sendStructure: true,
      sendStructure_Patch: true,
      sendStructure_Immediately: false,
      sendGraphic_Kernel: graphics,
      sendGraphic_StructureObj: graphics,
      sendGraphic_Sketch: graphics,
      sendGraphic_Compressed: false,
      sendGraphic_Immediately: false,
      sendGraphic_ImmediatelyBinary: false,
      sendGraphic_Multipackage: false,
      sendMessages: true,
      sendMessages_Immediately: false,
    },
  })
  await new Promise(r => setTimeout(r, 300))

  function request(command: string, extra: Record<string, unknown> = {}): Promise<Envelope> {
    const transactionID = randomUUID()
    return new Promise<Envelope>((resolve, reject) => {
      pending.set(transactionID, { resolve, reject })
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

  async function getTree(o?: { refresh?: boolean }): Promise<Record<string, any>> {
    if (o?.refresh || !lastStructure) {
      // Any read-only call refreshes the snapshot (structure rides every Result).
      await execute({ 'v1.common.getAppVersion': [{}] } as Task)
    }
    return lastStructure?.tree ?? {}
  }

  async function getGraphic(o?: { recalc?: boolean }): Promise<{ containers?: any[] } | null> {
    // Recalc-first for fresh state (cached graphic may be stale/intermediate);
    // recalc DESTROYS entity-injection bodies — callers pass recalc:false there.
    if (o?.recalc !== false) {
      try {
        const r = await execute({ 'v1.common.recalc': [{}] } as Task)
        const g = r.graphic as { containers?: any[] } | null
        if (g?.containers?.some(c => c.meshes?.length > 0 || c.edges?.length > 0)) return g
      } catch {
        /* fall through to accumulated graphic */
      }
    }
    return lastGraphic
  }

  return {
    env: 'node',
    execute,
    request,
    getTree,
    getGraphic,
    getLastGraphic: () => lastGraphic,
    getStructure: () => lastStructure,
    namespaces: opts.namespaces,
    close: () => {
      if (ws.readyState <= WebSocket.OPEN) ws.close()
    },
  }
}
