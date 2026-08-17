export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoGate' })).result

  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 40, width: 40, height: 30 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 30, width: 30, height: 50, references: [wcs] })).result

  // Delete box2
  const delId = (await api.v1.part.entityDeletion({ id: partId, name: 'Del1', targets: [box2] })).result
  console.log('[09] delId:', delId)

  // Try update WITHOUT openFeature
  const r1 = await api.v1.part.updateEntityDeletion({ id: delId, targets: [box1] })
  console.log('[09] update no gate result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[09] update no gate msg:', r1.messages?.[0]?.message)

  // Now try with openFeature
  await api.v1.part.openFeature({ id: delId })
  const r2 = await api.v1.part.updateEntityDeletion({ id: delId, targets: [box1] })
  await api.v1.part.closeFeature({ id: delId })
  console.log('[09] update with gate result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    noGate: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    withGate: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'gate-comparison')

  await snapshot('after-update-to-box1')

  return { partId }
}
