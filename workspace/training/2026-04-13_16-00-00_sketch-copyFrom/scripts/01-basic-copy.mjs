// Test basic copyFrom: copy geometry from one sketch to another
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyFromTest' })).result

  // Create source sketch with a rectangle and a circle
  const srcSkId = (await api.v1.sketch.create({ id: partId })).result
  const rectLines = (await api.v1.sketch.rectangle({ id: srcSkId, startPos: [0, 0, 0], endPos: [40, 30, 0] })).result
  const circle = (await api.v1.sketch.circle({ id: srcSkId, centerPos: [60, 15, 0], radius: 10 })).result
  console.log('[01] source sketch:', srcSkId, 'rectLines:', rectLines, 'circle:', circle)

  await snapshot('source-sketch')

  // Create destination sketch (empty)
  const dstSkId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[01] destination sketch (empty):', dstSkId)

  // Copy from source to destination
  const r = await api.v1.sketch.copyFrom({ id: dstSkId, toCopyId: srcSkId })
  console.log('[01] copyFrom result:', r.result)
  console.log('[01] copyFrom maxLevel:', r.maxLevel)
  console.log('[01] copyFrom messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'copyFrom-response')

  await snapshot('dest-after-copy')

  return { partId, srcSkId, dstSkId }
}
