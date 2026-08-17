export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result
  console.log('[08] setup done')

  // Test zero radius only — hypothesis: this hangs the server
  console.log('[08] about to call circle with radius=0...')
  const r0 = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 0 })
  console.log('[08] zero radius result:', r0.result, 'maxLevel:', r0.maxLevel)
  console.log('[08] messages:', JSON.stringify(r0.messages))

  filewrite({ result: r0.result, messages: r0.messages, maxLevel: r0.maxLevel }, 'zero-radius')

  return { partId, shapeId }
}
