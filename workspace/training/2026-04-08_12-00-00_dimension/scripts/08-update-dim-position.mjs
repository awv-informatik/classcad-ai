// Test updateDimensionPosition — move dimension text location
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result
  console.log('[08] dimId:', dimId)

  // Update dimension position
  const r = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [40, -20, 0] })
  console.log('[08] updateDimensionPosition result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))

  // Update again to different position
  const r2 = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [40, 80, 0] })
  console.log('[08] updateDimensionPosition2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    update1: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    update2: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'update-pos-responses')

  await snapshot('after-pos-update')
  return { partId, skId }
}
