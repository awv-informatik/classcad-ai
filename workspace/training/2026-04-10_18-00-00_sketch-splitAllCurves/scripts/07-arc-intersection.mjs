// 07 — Arc intersected by a line. How are arc segments named?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitArc' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arc = (await api.v1.sketch.arcByCenter({
    id: skId,
    centerPos: [0, 0, 0],
    startPos: [30, 0, 0],
    endPos: [0, 30, 0]
  })).result
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-10, 10, 0], endPos: [40, 10, 0] })).result
  console.log('[07] arc:', arc, 'line:', line)

  await snapshot('before')

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[07] result:', JSON.stringify(r.result))
  console.log('[07] maxLevel:', r.maxLevel)
  console.log('[07] result length:', r.result?.length)

  const tree = r.structure?.tree
  if (tree) {
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) console.log('[07] segment', id, ':', node.class, node.name)
    }
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'arc-response')
  await snapshot('after')
  return { partId }
}
