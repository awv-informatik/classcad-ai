export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result
  console.log('[01] partId:', partId, 'eifId:', eifId, 'shapeId:', shapeId)

  // Basic circle with required params only
  const r = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20 })
  console.log('[01] circle result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'circle-response')

  await snapshot('basic-circle')
  return { partId, shapeId }
}
