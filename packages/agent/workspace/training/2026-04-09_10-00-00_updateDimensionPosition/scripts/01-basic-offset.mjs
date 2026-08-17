// Test updateDimensionPosition basic call with an OFFSET dimension
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle to get lines
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  console.log('[01] rectIds:', rectIds)

  // Create an OFFSET dimension on the first line
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })
  const dimId = dimR.result
  console.log('[01] dimId:', dimId)

  // Find dimPt in structure tree before update
  filewrite(dimR.structure, 'initial-structure')

  // Call updateDimensionPosition
  const r2 = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [50, 60, 0] })
  console.log('[01] updateDimensionPosition result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[01] messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'update-response')

  // Get updated structure after position change
  filewrite(r2.structure, 'after-structure')

  await snapshot('after-update')
  return { partId, dimId }
}
