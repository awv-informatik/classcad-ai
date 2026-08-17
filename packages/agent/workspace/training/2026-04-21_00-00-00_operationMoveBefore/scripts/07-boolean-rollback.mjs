export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolRollback' })).result
  console.log('[07] partId:', partId)

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40, name: 'MainBox' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 15, height: 60, position: [30, 20, 0], name: 'CutCyl' })).result
  console.log('[07] boxId:', boxId, 'cylId:', cylId)

  // Create boolean subtraction
  const boolId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: boxId, tools: [cylId] })).result
  console.log('[07] boolId:', boolId)

  await snapshot('after-boolean')

  // Roll back before the boolean — should show box + cylinder, no cut
  await api.v1.part.operationMoveBefore({ id: partId, featureId: boolId })
  await snapshot('before-boolean')

  // Roll back before cylinder — should show only box
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })
  await snapshot('before-cylinder')

  // Move to end — boolean restored
  await api.v1.part.operationMoveToEnd({ id: partId })
  await snapshot('restored-boolean')

  return { partId }
}
