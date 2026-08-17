// Test updateDimensionPosition on a deleted dimension
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result
  console.log('[09] dimId:', dimId)

  // Delete the dimension
  const delR = await api.v1.sketch.deleteObject({ id: dimId })
  console.log('[09] deleteObject result:', delR.result, 'maxLevel:', delR.maxLevel)

  // Try updateDimensionPosition on deleted dim
  const r = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [50, 60, 0] })
  console.log('[09] deleted dim → result:', r.result, 'maxLevel:', r.maxLevel, 'msgs:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'deleted-dim-result')
  return {}
}
