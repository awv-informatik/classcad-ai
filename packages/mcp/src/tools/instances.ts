// Materialized instances. calculateMassProperties on an INSTANCE gives every instance of the
// assembly its own geometryIdList (isDirty 0). Saved as OFB, those lists reopen as [0], and
// Buerligons / buerli apps — which draw an instance from its geometryIdList when it has one —
// show nothing for it. Instances that were never measured (also those loaded from STEP) carry
// no list, so a list on a template-level instance is the signal.

type TreeNode = { class?: string; geometryIdList?: unknown }

/** Ids of the template-level instances (CC_ProductReference) that carry their own geometryIdList. */
export function materializedInstances(tree: Record<string, TreeNode> | null | undefined): string[] {
  if (!tree) return []
  return Object.entries(tree)
    .filter(([, n]) => n?.class === 'CC_ProductReference' && Array.isArray(n.geometryIdList))
    .map(([id]) => id)
}

export const MATERIALIZED_NOTE =
  'calculateMassProperties on an instance materialized them (own geometryIdList). Saved as OFB, they reopen ' +
  'invisible in Buerligons and buerli apps. Measure templates and the root instead, and re-create these ' +
  'instances in place (same transformation and name) before saving — docs(["recipes/clean-construction"]), section 4.'
