// share/protocol.ts — the session protocol, as far as the MCP names it.
//
// A ClassCAD server (Drogon) shares a session by invite: the host mints
// tokens, guests connect with ?invite=<token>, the server fans every
// command's frames out to everyone in the session and relays presence. The
// specification is SessionSharing.md in the ClassCAD sources
// (runtime/Source/NetworkService/docs); buerli's WSClient is the client side.
// share/hub.ts speaks the server's part for the MCP's own engine.
//
// On top of the server's protocol sit presence channels the buerli packages
// define (@buerli.io/classcad: session/selection.ts and session/identity.ts;
// @buerli.io/react-cad: session/sessionClient.ts) and the MCP speaks too.
// Presence needs nothing from the server but its fan-out, so they work the
// same on a server and on the hub:
//   client     who a participant is: the app, its version, a name to show
//   selection  what a participant has selected, published whenever it changes
//   select     a request to the others to select something (an agent pointing)
//   config     the host's word on what its guests are offered (host only)

export type Role = 'edit' | 'view'

/** A frame of the session protocol that answers no request. */
export type SessionFrame = { command: string; [key: string]: any }

export type PresenceFrame = { command: 'Presence'; channel: string; peerId: string; data: Record<string, any> }

/** Largest presence frame a server relays; larger ones are dropped without a word. The hub does the same. */
export const PRESENCE_MAX_BYTES = 8 * 1024

/** Channels only the host may publish on, and the one only the server writes. */
export const HOST_CHANNELS = new Set(['config'])
export const SERVER_CHANNELS = new Set(['leave'])

export const CONFIG_CHANNEL = 'config'
export const CLIENT_CHANNEL = 'client'
export const SELECTION_CHANNEL = 'selection'
export const SELECT_CHANNEL = 'select'

/** What a host says its guests are offered, on the 'config' channel. Apps hide what is not. */
export type SessionConfig = {
  /** The formats a model may be saved in from this session. */
  saveFormats?: string[]
}

/** What a participant says about itself on the 'client' channel. */
export type ClientIdentity = {
  /** The program: 'buerligons', 'classcad-mcp', … */
  app: string
  version?: string
  /** A name to show for this participant ("Claude Code"). */
  name?: string
  /** 'agent' for an AI agent's session, 'app' for a person at an app. */
  kind?: 'app' | 'agent'
}

/**
 * One selected thing, as published on the 'selection' channel: a face, edge or
 * vertex of a body, or an object of the model tree (a sketch entity, a
 * dimension, a feature). The ids are the engine's own.
 */
export type SelectionItem = {
  kind: 'face' | 'edge' | 'vertex' | 'object'
  /** The model tree object: the picked object itself, or the owner of the picked geometry (a solid). */
  objectId: number
  /** The product or assembly instance the pick was made in. */
  prodRefId?: number | null
  /** Geometry: the body's graphic container. It is replaced whenever the body is rebuilt. */
  containerId?: number
  /** Geometry: the element in the container. This is the id API calls take for a face, an edge or a vertex. */
  graphicId?: number
  /** Geometry: the element's type (plane, cylinder, line, arc, …). Objects: their class. */
  type?: string
  /** Objects: their name in the model tree. */
  name?: string
}

/** The 'selection' channel's payload. `total` counts the whole selection; `items` may be cut to fit a presence frame. */
export type SelectionFrame = { items: SelectionItem[]; total: number }

/** What a 'select' request names: a tree object by its id, or geometry by its element id (and container, when known). */
export type SelectTarget = { objectId?: number; prodRefId?: number | null; containerId?: number; graphicId?: number }

/**
 * The 'select' channel's payload. A request carries the items; right after it
 * the sender publishes `{ id, done: true }`, so that the frame a server keeps
 * for late joiners asks for nothing.
 */
export type SelectFrame = { id: string; items?: SelectTarget[]; replace?: boolean; done?: boolean }

/** A participant other than this MCP session, as far as it is known here. */
export type Peer = {
  peerId: string
  /** Known when this session is the host: the invite the guest joined with. */
  invite?: string
  inviteName?: string
  role?: Role
  identity?: ClientIdentity
}

/** The emission config a fresh connection has on a server: full content, bundled on the Result. */
export const DEFAULT_EMISSION: Record<string, boolean | number> = {
  sendStructure: true,
  sendStructure_Patch: false,
  sendStructure_Compressed: false,
  sendStructure_Immediately: false,
  sendStructure_ImmediatelyBinary: false,
  sendGraphic_Kernel: true,
  sendGraphic_StructureObj: true,
  sendGraphic_Sketch: true,
  sendGraphic_Invisible: true,
  sendGraphic_Compressed: false,
  sendGraphic_Immediately: false,
  sendGraphic_ImmediatelyBinary: false,
  sendGraphic_Multipackage: false,
  sendGraphic_UseDraco: false,
  sendGraphic_UseDracoHybrid: false,
  sendGraphic_AdvancedNotifications: false,
  sendMessages: true,
  sendMessages_Immediately: false,
  sendMessages_MinLevel: 31,
  storeState: false,
  safeApi: false,
}
