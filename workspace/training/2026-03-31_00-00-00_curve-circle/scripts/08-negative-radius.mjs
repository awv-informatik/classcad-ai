export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result
  console.log('[08] setup done')

  // Test negative radius — skip zero (known to hang server)
  console.log('[08] about to call circle with radius=-15...')
  const rNeg = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: -15 })
  console.log('[08] negative radius result:', rNeg.result, 'maxLevel:', rNeg.maxLevel)
  console.log('[08] messages:', JSON.stringify(rNeg.messages))

  filewrite(rNeg.structure, 'structure-negative-radius')

  await snapshot('negative-radius')
  return { partId, shapeId }
}
