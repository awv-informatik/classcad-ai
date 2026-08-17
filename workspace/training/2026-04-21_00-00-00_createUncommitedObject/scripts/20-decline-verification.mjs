export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeclineVerify' })).result

  // Create and decline an uncommitted box
  const box1 = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'Decline1' })).result
  console.log('[20] uncommitted:', box1)

  // Decline: open + close with NO update call between
  await api.v1.part.openFeature({ id: box1 })
  const closeR = await api.v1.part.closeFeature({ id: box1 })
  console.log('[20] closeFeature:', closeR.result, 'maxLevel:', closeR.maxLevel)

  // Verify declined: check uncommitedObjectsIds
  const tree1 = closeR.structure?.tree
  const unc1 = tree1?.['1']?.members?.uncommitedObjectsIds?.members
  console.log('[20] uncommitedObjectsIds after decline:', JSON.stringify(unc1?.map(m => m.value)))
  console.log('[20] node exists:', !!tree1?.[box1])

  // Should be able to create new uncommitted now
  const box2 = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'AfterDecline' })).result
  console.log('[20] new after decline:', box2, box2 ? 'OK' : 'BLOCKED')

  if (box2) {
    // Commit this one WITH update
    await api.v1.part.openFeature({ id: box2 })
    await api.v1.part.updateBox({ id: box2, length: 50, width: 30, height: 20 })
    await api.v1.part.closeFeature({ id: box2 })
    console.log('[20] committed box2')

    // Verify committed box exists
    const get = await api.v1.part.getFeature({ id: partId, name: 'AfterDecline' })
    console.log('[20] getFeature AfterDecline:', get.result)

    // Verify declined box does NOT exist
    const get2 = await api.v1.part.getFeature({ id: partId, name: 'Decline1' })
    console.log('[20] getFeature Decline1:', get2.result, '(should be null)')

    await snapshot('after-decline-and-commit')
  }

  return { partId }
}
