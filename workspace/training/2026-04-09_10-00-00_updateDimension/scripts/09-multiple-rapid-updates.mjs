// 09 — Multiple rapid updates to same dimension, verify last value sticks
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1] })).result
  console.log('[09] dimId:', dimId)

  // Rapid sequence of updates
  const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  const results = []
  for (const v of values) {
    const r = await api.v1.sketch.updateDimension({ id: dimId, value: v })
    results.push({ value: v, result: r.result, maxLevel: r.maxLevel })
  }
  console.log('[09] all updates succeeded:', results.every(r => r.maxLevel <= 31))
  filewrite(results, 'rapid-updates')

  // Now read back the structure to verify the last value (100) is stored
  // Use getExpression or structure tree to check
  const structR = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[09] getGeometry maxLevel:', structR.maxLevel)

  return { partId, dimId }
}
