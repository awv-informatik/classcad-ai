// 18 — Complex case: circle with multiple crossing lines (4 intersections per line)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitMany' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 40 })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-60, 20, 0], endPos: [60, 20, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [-60, -20, 0], endPos: [60, -20, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [20, -60, 0], endPos: [20, 60, 0] })).result
  console.log('[18] circle:', circle, 'l1:', l1, 'l2:', l2, 'l3:', l3)

  await snapshot('before')

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[18] result:', JSON.stringify(r.result))
  console.log('[18] maxLevel:', r.maxLevel)
  console.log('[18] result length:', r.result?.length)

  const tree = r.structure?.tree
  if (tree) {
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) console.log('[18] segment', id, ':', node.class, node.name)
    }
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'many-response')
  await snapshot('after')
  return { partId }
}
