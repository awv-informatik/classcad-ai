// bridge/protocol.ts — wire protocol between a buerli app and this MCP.
//
// Mirror of @buerli.io/classcad's src/bridge/protocol.ts (source of truth
// there). Apps open an OUTBOUND WebSocket to the MCP's bridge listener and
// announce a share token. Two kinds:
//   • 'invite' — the app runs against a ClassCAD server; the MCP joins the
//     server session with the token (use_session) and uses the bridge for
//     app state (selection) only.
//   • 'bridge' — the engine runs inside the app (WASM); the MCP relays its
//     engine commands over this link (engine.execute) — the bridge IS the
//     engine transport.
// Plain TS, importable from Node and the browser.

export const PROTOCOL_VERSION = 1

export type Capability = 'engine.execute' | 'selection.read' | 'selection.write'

export type RawSelection = { containerId: number; graphicId: number; prodRefId: number }

export type SelectionEntity = {
  kind: 'face' | 'edge' | 'vertex' | 'curve' | 'unknown'
  classcadId?: number
  position?: { x: number; y: number; z: number }
  normal?: { x: number; y: number; z: number }
  graphicType?: string
  raw: RawSelection
}

export type ShareKind = 'invite' | 'bridge'

export type AnnounceMessage = {
  type: 'announce'
  protocolVersion: number
  /** The share token this connection serves (one bridge connection per token). */
  token: string
  kind: ShareKind
  drawingId: string
  app: string
  appVersion?: string
  capabilities: Capability[]
  /** Stable per-connection id so the MCP can tell apart several apps for one token. */
  clientId: string
  /** Legacy (pre-token) announce field; treated as the token when `token` is absent. */
  sessionId?: string
  /** Legacy modeler announce field; treated as an 'invite' token when `token` is absent. */
  invite?: string
}

export type RequestMessage = { type: 'request'; id: number; method: BridgeMethod; params?: unknown }
export type ResponseMessage = { type: 'response'; id: number; result?: unknown; error?: { code: string; message: string } }
export type EventMessage = { type: 'event'; channel: BridgeEventChannel; payload: unknown }
export type BridgeEnvelope = AnnounceMessage | RequestMessage | ResponseMessage | EventMessage

/** Methods the MCP calls on the app. */
export type BridgeMethod = 'engine.execute' | 'session.attached' | 'session.detached' | 'selection.get' | 'selection.set'

/** engine.execute reply: the engine's text messages and inflated binary graphic packages, in emission order. */
export type EngineExecuteResult = { messages: Record<string, any>[]; binaryMessages: Record<string, any>[] }
export type SessionAttachedParams = { peerId: string; role?: 'edit' | 'view'; client?: string }

export type SelectionGetResult = SelectionEntity[]
export type SelectionSetParams = { items: Array<RawSelection | { classcadId: number }>; replace?: boolean }

export type BridgeEventChannel = 'selection.changed'
export type SelectionChangedPayload = { items: SelectionEntity[] }
