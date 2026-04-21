export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PropagateTest' })).result

  // Create a box, then a boolean subtraction (cylinder cutting through)
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 10, height: 60, position: [20, 15, -10] })).result
  const boolId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: boxId, tools: [cylId] })).result
  console.log('[05] boxId:', boxId, 'cylId:', cylId, 'boolId:', boolId)

  await snapshot('initial-with-cut')

  // Roll back before the boolean
  await api.v1.part.operationMoveBefore({ id: partId, featureId: boolId })

  // Update the box to be much taller — this should change the boolean result
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 100 })
  await api.v1.part.closeFeature({ id: boxId })
  console.log('[05] updated box height to 100 while bar is before boolean')

  await snapshot('mid-tree-taller-box')

  // moveToEnd — should recalc the boolean with the now-taller box
  const r = await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[05] moveToEnd — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'moveToEnd-propagate')

  await snapshot('after-moveToEnd-propagated')

  return { partId }
}
