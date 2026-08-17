// Test updateDimensionPosition with missing params
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result
  console.log('[05] dimId:', dimId)

  // Missing pos
  const r1 = await api.v1.sketch.updateDimensionPosition({ id: dimId })
  console.log('[05] missing pos → result:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  // Missing id
  const r2 = await api.v1.sketch.updateDimensionPosition({ pos: [10, 10, 0] })
  console.log('[05] missing id → result:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  // Empty object
  const r3 = await api.v1.sketch.updateDimensionPosition({})
  console.log('[05] empty → result:', r3.result, 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  filewrite({
    missingPos: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    missingId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    empty: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'missing-params-errors')

  return {}
}
