export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ClearTest' })).result

  // Create uncommitted box
  const boxId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'WillClear' })).result
  console.log('[09] uncommitted boxId:', boxId)

  // Try operationMoveToEnd (rollback bar to end)
  const moveR = await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[09] operationMoveToEnd:', moveR.result, 'maxLevel:', moveR.maxLevel)

  // Check uncommitedObjectsIds
  const tree1 = moveR.structure?.tree
  const unc1 = tree1?.['1']?.members?.uncommitedObjectsIds
  console.log('[09] uncommitedObjectsIds after moveToEnd:', JSON.stringify(unc1?.members?.map(m => m.value)))

  // Try openFeature then closeFeature (this is "commit")
  if (unc1?.members?.length > 0) {
    console.log('[09] Still uncommitted, committing via open+close with no update')
    await api.v1.part.openFeature({ id: boxId })
    await api.v1.part.closeFeature({ id: boxId })
    console.log('[09] committed')

    const recR = await api.v1.common.recalc({})
    const tree2 = recR.structure?.tree
    const unc2 = tree2?.['1']?.members?.uncommitedObjectsIds
    console.log('[09] uncommitedObjectsIds after commit:', JSON.stringify(unc2?.members?.map(m => m.value)))

    // Now try getFeature
    const getR = await api.v1.part.getFeature({ id: partId, name: 'WillClear' })
    console.log('[09] getFeature:', getR.result, 'maxLevel:', getR.maxLevel)

    // Can we delete the committed feature?
    const delR = await api.v1.part.deleteFeature({ ids: [boxId] })
    console.log('[09] deleteFeature after commit:', delR.result, 'maxLevel:', delR.maxLevel, 'msg:', delR.messages?.[0]?.message || 'none')
  }

  return { partId }
}
