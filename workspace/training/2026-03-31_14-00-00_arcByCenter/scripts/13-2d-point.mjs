// 13 — 2D point shorthand: does [x,y] work or must be [x,y,z]?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  const r = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0],
    startPos: [10, 0],
    endPos: [0, 10],
  })
  console.log('[13] 2D points:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'response')

  return { partId }
}
