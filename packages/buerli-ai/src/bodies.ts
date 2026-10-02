// ─── Bodies in the structure tree ─────────────────────────────────────────────
//
// A part's bodies are the classes the engine derives from CC_Body: closed —
// CC_Solid and its subclass CC_DecoratedSolid; open — CC_Sheet (e.g. an
// extrusion with capEnds: 0). A later feature consumes a body
// (members.consumed.value === 1), solid or sheet alike; the node and its
// graphic container stay. See @classcad/script docs/STRUCTURE.md.

type BodyNode = { class?: unknown; members?: Record<string, { value?: unknown } | undefined> } | null | undefined

const SOLID_CLASSES = new Set(['CC_Solid', 'CC_DecoratedSolid'])

export const isSolid = (n: BodyNode): boolean => SOLID_CLASSES.has(String(n?.class))
export const isSheet = (n: BodyNode): boolean => n?.class === 'CC_Sheet'
export const isBody = (n: BodyNode): boolean => isSolid(n) || isSheet(n)

/** A body that a later feature superseded. Other nodes with a `consumed` member (curve shapes) do not count. */
export const isConsumedBody = (n: BodyNode): boolean => isBody(n) && n?.members?.consumed?.value === 1

/**
 * The graphic containers of what is current: a container whose owner is a
 * consumed body is left out. Curves, sketches and unknown owners stay.
 */
export function liveContainers<C extends { owner?: number | null }>(containers: C[], tree: Record<string, BodyNode>): C[] {
  return containers.filter(c => !isConsumedBody(c.owner != null ? tree[String(c.owner)] : undefined))
}
