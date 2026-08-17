export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CommitVsDecline' })).result

  // === COMMIT: create + open + update + close ===
  const commitId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'Committed' })).result
  console.log('[10] committedId:', commitId)

  await api.v1.part.openFeature({ id: commitId })
  await api.v1.part.updateBox({ id: commitId, length: 60, width: 40, height: 30 })
  await api.v1.part.closeFeature({ id: commitId })

  const getCommit = await api.v1.part.getFeature({ id: partId, name: 'Committed' })
  console.log('[10] getFeature "Committed":', getCommit.result, 'maxLevel:', getCommit.maxLevel)

  // === DECLINE: create + open + close (no update) ===
  const declineId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'Declined' })).result
  console.log('[10] declineId:', declineId)

  await api.v1.part.openFeature({ id: declineId })
  await api.v1.part.closeFeature({ id: declineId })

  const getDecline = await api.v1.part.getFeature({ id: partId, name: 'Declined' })
  console.log('[10] getFeature "Declined":', getDecline.result, 'maxLevel:', getDecline.maxLevel)

  // Check structure
  const recR = await api.v1.common.recalc({})
  const tree = recR.structure?.tree
  const unc = tree?.['1']?.members?.uncommitedObjectsIds
  console.log('[10] uncommitedObjectsIds:', JSON.stringify(unc?.members?.map(m => m.value)))

  // Check if declineId node still exists in the tree
  console.log('[10] committed node exists:', !!tree?.[commitId])
  console.log('[10] declined node exists:', !!tree?.[declineId])

  await snapshot('after-both')
  return { partId, commitId, declineId }
}
