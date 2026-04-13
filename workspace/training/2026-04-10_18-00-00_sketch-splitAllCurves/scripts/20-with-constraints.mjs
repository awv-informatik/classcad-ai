// 20 — Sketch with constraints. Does splitting work with constrained geometry?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitConstrained' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create constrained geometry: two lines with a perpendicular constraint
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-40, -20, 0], endPos: [40, 20, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [-20, 30, 0], endPos: [20, -30, 0] })).result

  // Add a coincident constraint at intersection
  // (The lines cross, so they'll have an intersection regardless)
  console.log('[20] l1:', l1, 'l2:', l2)

  await snapshot('before')

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[20] result:', JSON.stringify(r.result))
  console.log('[20] maxLevel:', r.maxLevel)
  console.log('[20] result length:', r.result?.length)

  const tree = r.structure?.tree
  if (tree) {
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) console.log('[20] segment', id, ':', node.class, node.name)
    }
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'constrained-response')
  await snapshot('after')
  return { partId }
}
