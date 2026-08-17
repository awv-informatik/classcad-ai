// Test basic OFFSET dimension on a single line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle to get lines
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  console.log('[01] rectangle IDs:', rectIds)

  // OFFSET dimension on the bottom line (should measure its length)
  const r = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })
  console.log('[01] dimension result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'offset-response')

  // Try OFFSET between two parallel lines
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0], rectIds[2]] })
  console.log('[01] offset-2-lines result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[01] offset-2-lines messages:', JSON.stringify(r2.messages))

  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'offset-2lines-response')

  await snapshot('offset-dims')

  return { partId, skId, rectIds, dimId: r.result, dimId2: r2.result }
}
