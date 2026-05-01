// client.ts — ClassCAD WebSocket client (TS port of scripts/client.mjs).
//
// Connects to a Drogon WS server, sends the mandatory Configuration command,
// and exposes promise-based execute()/request() helpers. Caches the latest
// graphic payload and structure tree so MCP tools can read state without an
// extra round-trip.

import WebSocket from 'ws'
import { randomUUID } from 'crypto'
import type { ApiResult, Graphic, GraphicContainer, Message, Structure } from './types.js'

const DEFAULT_URL = 'ws://0.0.0.0:9094/'
const REQUEST_TIMEOUT = 30_000
const CONNECT_TIMEOUT = 5_000

type PendingEntry = {
  resolve: (r: ApiResult) => void
  reject: (e: Error) => void
}

export type ConnectOptions = {
  graphics?: boolean   // default true — enables server-side graphic push
  debug?: boolean      // default false — disables all timeouts
}

export type Client = {
  request: <T = unknown>(command: string, extra?: object) => Promise<ApiResult<T>>
  execute: <T = unknown>(task: object) => Promise<ApiResult<T>>
  close: () => void
  getStructure: () => Structure | null
  getLastGraphic: () => Graphic | null
  refreshTree: () => Promise<Structure | null>
  ws: WebSocket
  url: string
}

export async function connect(url: string = DEFAULT_URL, opts: ConnectOptions = {}): Promise<Client> {
  const graphics = opts.graphics !== false
  const debug = opts.debug === true
  const pending = new Map<string, PendingEntry>()

  let lastGraphic: Graphic | null = null
  let lastStructure: Structure | null = null

  const ws = new WebSocket(url)

  function send(obj: object): void {
    ws.send(JSON.stringify(obj))
  }

  function request<T = unknown>(command: string, extra: object = {}): Promise<ApiResult<T>> {
    const transactionID = randomUUID()
    return new Promise((resolve, reject) => {
      pending.set(transactionID, { resolve: resolve as (r: ApiResult) => void, reject })
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

  function execute<T = unknown>(task: object): Promise<ApiResult<T>> {
    return request<T>('Execute', { task: [task], options: { undoable: false } })
  }

  function handleFrame(data: WebSocket.RawData, isBinary: boolean): void {
    if (isBinary) return
    let frame: any
    try { frame = JSON.parse(data.toString()) } catch { return }
    const txId = frame._transactionID_
    if (!txId) return
    const entry = pending.get(txId)
    if (!entry) return
    if (frame.command !== 'Result') return
    pending.delete(txId)

    let result = frame.result
    // Unwrap double-wrapped result (envelope-in-envelope)
    if (result && typeof result === 'object' && 'result' in result && Object.keys(result).length <= 3) {
      result = (result as any).result
    }
    const messages: Message[] = (frame.messages || []).filter((m: Message) => m.level > 31)

    // Graphic merge: replace non-curve containers, accumulate curve containers by ID.
    if (frame.graphic && (frame.graphic.containers?.length > 0 || frame.graphic.properties)) {
      if (!lastGraphic) {
        lastGraphic = frame.graphic as Graphic
      } else {
        const incoming: GraphicContainer[] = frame.graphic.containers || []
        const existing: GraphicContainer[] = lastGraphic.containers || []
        const curveById = new Map<Id, GraphicContainer>()
        for (const c of existing) if (c.type === 2) curveById.set(c.id, c)
        for (const c of incoming) if (c.type === 2) curveById.set(c.id, c)
        const nonCurve = incoming.filter(c => c.type !== 2)
        const oldNonCurve = nonCurve.length > 0 ? [] : existing.filter(c => c.type !== 2)
        lastGraphic = {
          ...frame.graphic,
          containers: [...oldNonCurve, ...nonCurve, ...curveById.values()],
        } as Graphic
      }
    }

    // Structure: server sends full snapshots on every Result frame. Replace.
    // Defensive: ignore arrays (would be JSON Patch if ever enabled).
    if (frame.structure && typeof frame.structure === 'object' && !Array.isArray(frame.structure)) {
      lastStructure = frame.structure as Structure
    }

    entry.resolve({
      result,
      messages,
      maxLevel: frame.maxLevel ?? 0,
      structure: frame.structure ?? null,
      graphic: frame.graphic ?? null,
    })
  }

  type Id = number | string

  function close(): void {
    if (ws.readyState <= WebSocket.OPEN) ws.close()
  }

  function getLastGraphic(): Graphic | null { return lastGraphic }
  function getStructure(): Structure | null { return lastStructure }

  async function refreshTree(): Promise<Structure | null> {
    await request('Execute', {
      task: [{ 'v1.common.getAppVersion': [{}] }],
      options: { undoable: false },
    })
    return lastStructure
  }

  // Wait for connection
  await new Promise<void>((resolve, reject) => {
    ws.on('open', () => resolve())
    ws.on('error', err => reject(err))
    if (!debug) setTimeout(() => reject(new Error('Connection timeout')), CONNECT_TIMEOUT)
  })
  ws.on('message', (d, b) => handleFrame(d, b))

  // Mandatory Configuration handshake
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

  return { request, execute, close, getStructure, getLastGraphic, refreshTree, ws, url }
}
