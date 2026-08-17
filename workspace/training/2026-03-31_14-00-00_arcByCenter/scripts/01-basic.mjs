// 01 — Basic arcByCenter: create a simple arc with center, start, end (default isClockwise=TRUE)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
  console.log('[01] partId:', partId, 'eifId:', eifId, 'shapeId:', shapeId)

  // Arc: center at origin, start at (10,0,0), end at (0,10,0)
  // With default isClockwise=TRUE, should go clockwise from start to end
  const r = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [10, 0, 0],
    endPos: [0, 10, 0],
  })
  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'response')

  await snapshot('basic-arc')
  return { partId, shapeId }
}
