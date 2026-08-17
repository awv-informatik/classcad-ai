// 06 — Rectangle (4 lines) intersected by a diagonal. How does splitting handle rectangle segments?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitRect' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [-40, -25, 0], endPos: [40, 25, 0] })).result
  const diag = (await api.v1.sketch.line({ id: skId, startPos: [-60, -40, 0], endPos: [60, 40, 0] })).result
  console.log('[06] rect IDs:', JSON.stringify(rect), 'diag:', diag)

  await snapshot('before')

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[06] result:', JSON.stringify(r.result))
  console.log('[06] maxLevel:', r.maxLevel)
  console.log('[06] result length:', r.result?.length)

  // Map segment names
  const tree = r.structure?.tree
  if (tree) {
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) console.log('[06] segment', id, ':', node.class, node.name, 'parent:', node.parent)
    }
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel, rectIds: rect, diagId: diag }, 'rect-response')
  await snapshot('after')
  return { partId }
}
