// Test basic loadFrom: save a part with sketch as OFB data, then load sketch geometry from it
export default async function (api, { snapshot, filewrite }) {
  // Create a part with a sketch containing a rectangle and circle
  const partId = (await api.v1.part.create({ name: 'LoadFromSource' })).result
  const srcSkId = (await api.v1.sketch.create({ id: partId })).result
  await api.v1.sketch.rectangle({ id: srcSkId, startPos: [0, 0, 0], endPos: [40, 30, 0] })
  await api.v1.sketch.circle({ id: srcSkId, centerPos: [60, 15, 0], radius: 10 })
  console.log('[01] source part:', partId, 'source sketch:', srcSkId)

  await snapshot('source-sketch')

  // Save the entire drawing as OFB base64
  const saveResult = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  console.log('[01] save success:', saveResult.result?.success)
  console.log('[01] save content length:', saveResult.result?.content?.length)
  const ofbData = saveResult.result.content

  // Now create a fresh part with an empty sketch
  const part2Id = (await api.v1.part.create({ name: 'LoadFromDest' })).result
  const dstSkId = (await api.v1.sketch.create({ id: part2Id })).result
  console.log('[01] dest part:', part2Id, 'dest sketch:', dstSkId)

  // loadFrom using data
  const r = await api.v1.sketch.loadFrom({
    id: dstSkId,
    partId: part2Id,
    data: ofbData,
    encoding: 'base64',
    format: 'OFB',
  })
  console.log('[01] loadFrom result:', r.result)
  console.log('[01] loadFrom maxLevel:', r.maxLevel)
  console.log('[01] loadFrom messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'loadFrom-response')

  await snapshot('dest-after-load')

  return { part2Id, dstSkId }
}
