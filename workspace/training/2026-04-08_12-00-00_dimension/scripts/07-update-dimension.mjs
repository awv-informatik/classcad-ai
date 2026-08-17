// Test updateDimension — change value, check if geometry updates
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // Create OFFSET dimension on bottom line (auto-value = 80)
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result
  console.log('[07] dimId:', dimId)

  // Get positions before update
  const posBefore = await api.v1.sketch.getPositions({ id: skId })

  // Update dimension value to 120
  const r = await api.v1.sketch.updateDimension({ id: dimId, value: 120 })
  console.log('[07] updateDimension result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] updateDimension messages:', JSON.stringify(r.messages))

  // Get positions after update
  const posAfter = await api.v1.sketch.getPositions({ id: skId })

  filewrite({
    updateResult: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
    positionsBefore: posBefore.result,
    positionsAfter: posAfter.result,
    changed: JSON.stringify(posBefore.result) !== JSON.stringify(posAfter.result)
  }, 'update-comparison')

  // Try update with expression string
  const r2 = await api.v1.sketch.updateDimension({ id: dimId, value: '50' })
  console.log('[07] updateDimension string result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('after-update')
  return { partId, skId }
}
