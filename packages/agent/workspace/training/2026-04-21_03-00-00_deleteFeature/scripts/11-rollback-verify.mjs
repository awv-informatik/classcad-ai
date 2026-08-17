export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [50, 0, 0] })).result
  console.log('[11] boxId:', boxId, 'cylId:', cylId)

  // Roll back before cylinder
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })

  // Confirm cylinder is rolled back but findable by getFeature
  const preCheck = await api.v1.part.getFeature({ id: partId, name: 'Cylinder' })
  console.log('[11] getFeature for rolled-back cyl BEFORE delete:', preCheck.result)

  // Try deleting the rolled-back cylinder
  const r = await api.v1.part.deleteFeature({ ids: [cylId] })
  console.log('[11] delete rolled-back cyl — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))

  // Check if cylinder is findable AFTER errored delete (still rolled back)
  const postCheck = await api.v1.part.getFeature({ id: partId, name: 'Cylinder' })
  console.log('[11] getFeature for cyl AFTER errored delete (still rolled back):', postCheck.result, 'maxLevel:', postCheck.maxLevel)

  // Move to end — does the cylinder come back?
  await api.v1.part.operationMoveToEnd({ id: partId })

  const endCheck = await api.v1.part.getFeature({ id: partId, name: 'Cylinder' })
  console.log('[11] getFeature for cyl AFTER moveToEnd:', endCheck.result, 'maxLevel:', endCheck.maxLevel)

  await snapshot('after-moveToEnd')

  filewrite({
    deleteResponse: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    preDelete: preCheck.result,
    postDelete: postCheck.result,
    afterMoveToEnd: endCheck.result,
  }, 'rollback-verify')

  return { partId }
}
