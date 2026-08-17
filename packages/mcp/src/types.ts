// Shared types for the ClassCAD WS protocol.

export type Id = number | string

export type Message = {
  message: string
  level: number
  code: number
  api: string
}

// Structure tree — full snapshot delivered on every Result frame.
// Format observed empirically; see classcad-skill/references/common/state-tree.md.
export type StructureNode = {
  id: Id
  class: string
  name: string
  parent: Id | null
  flags: number
  children?: Id[]
  members?: Record<string, { value: unknown; type: string; visible: number; expression: string }>
  // Domain-specific keys (expressionSet, geometrySet, solids, ...)
  [key: string]: unknown
}

export type Structure = {
  root: Id
  currentProduct: Id
  currentInstance: Id
  testRoot: Id
  tree: Record<string, StructureNode>
}

// Graphic payload — mesh / sketch / curve data, accumulated across frames.
export type GraphicContainer = {
  id: Id
  type: number
  [key: string]: unknown
}

export type Graphic = {
  containers?: GraphicContainer[]
  properties?: unknown
  [key: string]: unknown
}

// What an Execute call returns through the client.
export type ApiResult<T = unknown> = {
  result: T
  messages: Message[]
  maxLevel: number
  structure: Structure | null
  graphic: Graphic | null
}
