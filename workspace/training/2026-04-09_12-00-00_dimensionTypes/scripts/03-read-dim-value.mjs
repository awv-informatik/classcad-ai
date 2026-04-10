// Try different ways to read the actual dimension value
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle 100x60
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [100, 60, 0] })).result

  // Create a named OFFSET dimension on the bottom line
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rect[0]], name: 'myWidth' })).result
  console.log('[03] dimId:', dimId)

  // Try getExpression with various IDs
  const r1 = await api.v1.part.getExpression({ id: partId, name: '@value' })
  console.log('[03] getExpression(part, @value):', r1.result, 'maxLevel=', r1.maxLevel)

  const r2 = await api.v1.part.getExpression({ id: dimId, name: '@value' })
  console.log('[03] getExpression(dim, @value):', r2.result, 'maxLevel=', r2.maxLevel)

  const r3 = await api.v1.part.getExpression({ id: dimId })
  console.log('[03] getExpression(dim, no name):', r3.result, 'maxLevel=', r3.maxLevel)

  // Try getExpression on sketch
  const r4 = await api.v1.part.getExpression({ id: skId, name: '@value' })
  console.log('[03] getExpression(sketch, @value):', r4.result, 'maxLevel=', r4.maxLevel)

  // Try to read it via updateDimension - create then read
  const r5 = await api.v1.sketch.updateDimension({ id: dimId, value: 75 })
  console.log('[03] updateDimension(75):', r5.result, 'maxLevel=', r5.maxLevel)

  // Now try getExpression again
  const r6 = await api.v1.part.getExpression({ id: dimId, name: '@value' })
  console.log('[03] getExpression after update:', r6.result, 'maxLevel=', r6.maxLevel)

  // Also try getExpression with param.name = 'myWidth' on part
  const r7 = await api.v1.part.getExpression({ id: partId, name: 'myWidth' })
  console.log('[03] getExpression(part, myWidth):', r7.result, 'maxLevel=', r7.maxLevel)

  return { partId }
}
