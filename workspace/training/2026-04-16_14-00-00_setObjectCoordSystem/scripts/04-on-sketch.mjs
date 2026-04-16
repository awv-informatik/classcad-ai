// Test setObjectCoordSystem on a sketch — the doc example uses a sketch
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoordSysSketch' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
  console.log('[04] partId:', partId, 'skId:', skId, 'rectIds:', rectIds)

  // Get positions before
  const posBefore = (await api.v1.sketch.getPositions({ id: skId })).result
  filewrite(posBefore, 'positions-before')
  console.log('[04] positions before:', JSON.stringify(posBefore).slice(0, 200))

  await snapshot('before')

  // Set coord system on the sketch — shift origin and rotate axes
  const r = await api.v1.common.setObjectCoordSystem({
    id: skId,
    origin: [0, 150, 0],
    xVec: [0, 1, 0],
    yVec: [0, 0, 1],
  })
  console.log('[04] setObjectCoordSystem on sketch result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages.length > 0) console.log('[04] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'sketch-response')

  // Get positions after
  const posAfter = (await api.v1.sketch.getPositions({ id: skId })).result
  filewrite(posAfter, 'positions-after')
  console.log('[04] positions after:', JSON.stringify(posAfter).slice(0, 200))

  await snapshot('after-sketch')

  return { partId, skId }
}
