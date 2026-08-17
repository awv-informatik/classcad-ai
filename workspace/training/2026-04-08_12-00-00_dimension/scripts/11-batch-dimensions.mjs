// Test batch dimension creation (Array<object> input)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  console.log('[11] rectIds:', rectIds)

  // Batch: create multiple dimensions in one call
  const r = await api.v1.sketch.dimension([
    { id: skId, type: 'OFFSET', geomIds: [rectIds[0]], name: 'width' },
    { id: skId, type: 'OFFSET', geomIds: [rectIds[1]], name: 'height' },
  ])
  console.log('[11] batch result:', JSON.stringify(r.result))
  console.log('[11] batch maxLevel:', r.maxLevel)
  console.log('[11] batch messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'batch-response')

  await snapshot('batch-dims')
  return { partId, skId }
}
