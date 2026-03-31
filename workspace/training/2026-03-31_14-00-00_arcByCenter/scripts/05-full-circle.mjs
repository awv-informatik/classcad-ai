// 05 — Full circle attempt: startPos == endPos
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // startPos == endPos — does this produce a full circle or fail?
  const r = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [10, 0, 0],
    endPos: [10, 0, 0],
    isClockwise: true,
  })
  console.log('[05] full circle attempt:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'response')

  await snapshot('full-circle-attempt')
  return { partId, shapeId }
}
