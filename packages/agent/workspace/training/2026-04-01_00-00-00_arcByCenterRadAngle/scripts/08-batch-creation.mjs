// 08 — Batch creation: pass array of arc definitions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'BatchArcs' })).result

  const r = await api.v1.curve.arcByCenterRadAngle([
    { id: shapeId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10 },
    { id: shapeId, centerPos: [30, 0, 0], startAngle: Math.PI / 4, endAngle: Math.PI, radius: 8 },
    { id: shapeId, centerPos: [60, 0, 0], startAngle: 0, endAngle: 2 * Math.PI, radius: 12 },
  ])
  console.log('[08] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'batch-response')

  await snapshot('batch-arcs')
  return { partId }
}
