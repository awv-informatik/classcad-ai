// bridge/protocol.ts — Wire protocol shared between the cc MCP and any
// CC-based app that wants to expose its client-side state (selection, etc.).
//
// This file is the canonical source of truth for the bridge protocol. The
// modeler-side equivalent (packages/modeler/src/mcpBridge.ts) mirrors these
// types verbatim. Keep them in sync.
//
// Plain TS — no Node-only or browser-only imports. Importable from both.

export const PROTOCOL_VERSION = 1

export type Capability =
  | 'selection.read'
  | 'selection.write'

export type RawSelection = {
  containerId: number
  graphicId: number
  prodRefId: number
}

export type SelectionEntity = {
  // High-level kind, derived from the underlying graphic type.
  kind: 'face' | 'edge' | 'vertex' | 'curve' | 'unknown'
  // ClassCAD object id of the owning solid/instance (when resolvable).
  classcadId?: number
  // World position for vertices, face center for faces, midpoint for edges.
  position?: { x: number; y: number; z: number }
  // World normal for faces.
  normal?: { x: number; y: number; z: number }
  // The underlying ClassCAD graphic-type tag (PLANE, CYLINDER, NURBSCURVE, ...).
  graphicType?: string
  // Always present — round-trip these into a ClassCAD API call directly.
  raw: RawSelection
}

// --- Envelopes ---------------------------------------------------------

export type AnnounceMessage = {
  type: 'announce'
  protocolVersion: number
  sessionId: string
  drawingId: string
  app: string            // human-readable app name, e.g. 'buerligons'
  appVersion?: string
  capabilities: Capability[]
  // Stable per-process id so the MCP can disambiguate multiple bridges
  // for the same session.
  clientId: string
}

export type RequestMessage = {
  type: 'request'
  id: number
  method: BridgeMethod
  params?: unknown
}

export type ResponseMessage = {
  type: 'response'
  id: number
  result?: unknown
  error?: { code: string; message: string }
}

export type EventMessage = {
  type: 'event'
  channel: BridgeEventChannel
  payload: unknown
}

export type BridgeEnvelope = AnnounceMessage | RequestMessage | ResponseMessage | EventMessage

// --- Methods (MCP → app) -----------------------------------------------

export type BridgeMethod =
  | 'selection.get'
  | 'selection.set'

export type SelectionGetResult = SelectionEntity[]

export type SelectionSetParams = {
  // Pass either the raw triplet or a classcadId (which the bridge resolves).
  items: Array<RawSelection | { classcadId: number }>
  // If true, replace the current selection. Otherwise add to it.
  replace?: boolean
}

// --- Events (app → MCP) ------------------------------------------------

export type BridgeEventChannel = 'selection.changed'

export type SelectionChangedPayload = {
  items: SelectionEntity[]
}
