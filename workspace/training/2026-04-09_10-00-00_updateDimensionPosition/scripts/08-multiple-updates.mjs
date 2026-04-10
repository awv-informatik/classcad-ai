// Test calling updateDimensionPosition multiple times on the same dimension
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result

  const positions = [
    [10, 10, 0],
    [50, 50, 0],
    [-20, 30, 0],
    [100, 0, 0],
    [40, 25, 0],
  ]

  const results = []
  for (const pos of positions) {
    const r = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos })
    const node = r.structure.tree[String(dimId)]
    const dimPt = node?.members?.dimPt?.value
    console.log(`[08] pos=${JSON.stringify(pos)} → dimPt=${JSON.stringify(dimPt)} maxLevel=${r.maxLevel}`)
    results.push({ input: pos, dimPt, maxLevel: r.maxLevel })
  }

  filewrite(results, 'multiple-updates')
  return {}
}
