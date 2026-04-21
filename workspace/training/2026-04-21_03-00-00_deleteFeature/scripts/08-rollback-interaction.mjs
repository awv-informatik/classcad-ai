export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [50, 0, 0] })).result
  const sphereId = (await api.v1.part.sphere({ id: partId, radius: 25, position: [-50, 0, 0] })).result
  console.log('[08] boxId:', boxId, 'cylId:', cylId, 'sphereId:', sphereId)

  // Roll back before the sphere — only box and cylinder active
  await api.v1.part.operationMoveBefore({ id: partId, featureId: sphereId })
  console.log('[08] rolled back before sphere')

  // Try deleting the sphere (rolled-back feature)
  const r1 = await api.v1.part.deleteFeature({ ids: [sphereId] })
  console.log('[08] delete rolled-back sphere — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[08] messages:', JSON.stringify(r1.messages))

  // Try deleting the cylinder (still active)
  const r2 = await api.v1.part.deleteFeature({ ids: [cylId] })
  console.log('[08] delete active cylinder while rolled back — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[08] messages:', JSON.stringify(r2.messages))

  // Move to end
  await api.v1.part.operationMoveToEnd({ id: partId })

  // Check what survived
  const boxCheck = await api.v1.part.getFeature({ id: partId, name: 'Box' })
  const cylCheck = await api.v1.part.getFeature({ id: partId, name: 'Cylinder' })
  const sphereCheck = await api.v1.part.getFeature({ id: partId, name: 'Sphere' })
  console.log('[08] after moveToEnd — box:', boxCheck.result, 'cyl:', cylCheck.result, 'sphere:', sphereCheck.result)

  await snapshot('after-rollback-deletes')

  filewrite({
    deleteRolledBack: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    deleteActive: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    survivors: { box: boxCheck.result, cyl: cylCheck.result, sphere: sphereCheck.result },
  }, 'rollback-interaction')

  return { partId }
}
