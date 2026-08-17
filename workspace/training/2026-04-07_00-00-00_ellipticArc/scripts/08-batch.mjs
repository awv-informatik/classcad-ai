// Batch creation — array parameter
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  const r = await api.v1.curve.ellipticArc([
    { id: shapeId, centerPos: [-40, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius1: 20, radius2: 10 },
    { id: shapeId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI, radius1: 15, radius2: 8 },
    { id: shapeId, centerPos: [40, 0, 0], startAngle: 0, endAngle: 3 * Math.PI / 2, radius1: 20, radius2: 12 },
  ])

  console.log('[08] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch')
  return { partId }
}
