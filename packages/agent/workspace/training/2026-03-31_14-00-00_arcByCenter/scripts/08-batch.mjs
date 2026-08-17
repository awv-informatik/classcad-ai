// 08 — Batch creation: pass an array of arc definitions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  const r = await api.v1.curve.arcByCenter([
    { id: shapeId, centerPos: [0, 0, 0], startPos: [15, 0, 0], endPos: [0, 15, 0], isClockwise: false },
    { id: shapeId, centerPos: [40, 0, 0], startPos: [55, 0, 0], endPos: [40, 15, 0], isClockwise: true },
    { id: shapeId, centerPos: [80, 0, 0], startPos: [95, 0, 0], endPos: [80, 15, 0], isClockwise: false },
  ])
  console.log('[08] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'response')

  await snapshot('batch')
  return { partId, shapeId }
}
