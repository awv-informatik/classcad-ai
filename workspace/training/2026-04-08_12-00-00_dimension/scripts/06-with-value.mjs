// Test dimension with explicit value parameter — does it constrain or just label?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create rectangle 80x50
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // Get geometry positions before dimension
  const posBefore = await api.v1.sketch.getPositions({ id: skId })
  console.log('[06] positions before:', JSON.stringify(posBefore.result))

  // OFFSET dimension on bottom line with explicit value=100 (line is 80 long)
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]], value: 100 })).result
  console.log('[06] dimension with value=100 result:', dimId)

  // Get positions after dimension — did geometry move?
  const posAfter = await api.v1.sketch.getPositions({ id: skId })
  console.log('[06] positions after:', JSON.stringify(posAfter.result))

  filewrite({
    positionsBefore: posBefore.result,
    positionsAfter: posAfter.result,
    changed: JSON.stringify(posBefore.result) !== JSON.stringify(posAfter.result)
  }, 'value-comparison')

  await snapshot('with-value')
  return { partId, skId, dimId }
}
