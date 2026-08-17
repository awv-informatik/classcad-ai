export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeclineTest2' })).result

  // Create uncommitted box
  const boxId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'WillDecline' })).result
  console.log('[08] uncommitted boxId:', boxId)

  // Try deleteFeature with correct param name (ids, not features)
  const del1 = await api.v1.part.deleteFeature({ ids: [boxId] })
  console.log('[08] deleteFeature with ids:', del1.result, 'maxLevel:', del1.maxLevel, 'msg:', del1.messages?.[0]?.message || 'none')

  // Check uncommitedObjectsIds
  const tree1 = del1.structure?.tree
  const unc1 = tree1?.['1']?.members?.uncommitedObjectsIds
  console.log('[08] uncommitedObjectsIds after deleteFeature:', JSON.stringify(unc1?.members?.map(m => m.value)))

  // If still there, try openFeature then deleteFeature
  if (unc1?.members?.length > 0) {
    console.log('[08] Uncommitted still present, trying open → delete...')
    const box2Id = unc1.members[0].value
    await api.v1.part.openFeature({ id: box2Id })
    const del2 = await api.v1.part.deleteFeature({ ids: [box2Id] })
    console.log('[08] delete after open:', del2.result, 'maxLevel:', del2.maxLevel, 'msg:', del2.messages?.[0]?.message || 'none')

    const tree2 = del2.structure?.tree
    const unc2 = tree2?.['1']?.members?.uncommitedObjectsIds
    console.log('[08] uncommitedObjectsIds after open+delete:', JSON.stringify(unc2?.members?.map(m => m.value)))
  }

  // Now try creating another one - should work if previous was properly removed
  const box3Id = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Cylinder', name: 'AfterDecline' })).result
  console.log('[08] new create after decline:', box3Id)

  return { partId }
}
