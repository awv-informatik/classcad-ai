// 02 — isClockwise=FALSE: should produce the minor (90°) arc
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Same geometry as 01 but isClockwise=FALSE
  const r = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [10, 0, 0],
    endPos: [0, 10, 0],
    isClockwise: false,
  })
  console.log('[02] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'response')

  await snapshot('ccw-arc')
  return { partId, shapeId }
}
