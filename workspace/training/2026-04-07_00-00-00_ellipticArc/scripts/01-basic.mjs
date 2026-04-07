// Basic elliptic arc — 90° arc with default xAxis/normal
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Quarter elliptic arc (0 to PI/2)
  const r = await api.v1.curve.ellipticArc({
    id: shapeId,
    centerPos: [0, 0, 0],
    startAngle: 0,
    endAngle: Math.PI / 2,
    radius1: 30,
    radius2: 15,
  })

  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  await snapshot('quarter-arc')
  return { partId }
}
