// 17 — Collinear/overlapping lines. Do they split where they overlap?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitCollinear' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two overlapping horizontal lines
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [20, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [-10, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[17] l1:', l1, 'l2:', l2)

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[17] result:', JSON.stringify(r.result))
  console.log('[17] maxLevel:', r.maxLevel)
  console.log('[17] result length:', r.result?.length)

  const tree = r.structure?.tree
  if (tree) {
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) console.log('[17] segment', id, ':', node.class, node.name)
    }
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'collinear-response')
  return { partId }
}
