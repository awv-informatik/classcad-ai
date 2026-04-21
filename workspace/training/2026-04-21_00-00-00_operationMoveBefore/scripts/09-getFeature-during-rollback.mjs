export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GetFeatureTest' })).result
  console.log('[09] partId:', partId)

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40, name: 'Box1' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [30, 0, 0], name: 'Cyl1' })).result
  console.log('[09] boxId:', boxId, 'cylId:', cylId)

  // Move before cylinder — is getFeature('Cyl1') still findable?
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })

  const r1 = await api.v1.part.getFeature({ id: partId, name: 'Cyl1' })
  console.log('[09] getFeature(Cyl1) while rolled back result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'getFeature-rolledback')

  const r2 = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  console.log('[09] getFeature(Box1) while visible result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Can we getFeature for a non-existent name?
  const r3 = await api.v1.part.getFeature({ id: partId, name: 'DoesNotExist' })
  console.log('[09] getFeature(nonexistent) result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'getFeature-nonexistent')

  await api.v1.part.operationMoveToEnd({ id: partId })
  return { partId }
}
