export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeclineTest' })).result

  // Create uncommitted box
  const boxId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'WillDecline' })).result
  console.log('[07] uncommitted boxId:', boxId)

  // Try to delete/decline it without committing
  // Option 1: deleteFeature
  const delR = await api.v1.part.deleteFeature({ id: partId, features: [boxId] })
  console.log('[07] deleteFeature result:', delR.result, 'maxLevel:', delR.maxLevel)
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-response')

  // Check if uncommitedObjectsIds is now empty
  const tree = delR.structure?.tree
  if (tree && tree['1']) {
    const uncommitted = tree['1'].members?.uncommitedObjectsIds
    console.log('[07] uncommitedObjectsIds after delete:', JSON.stringify(uncommitted))
  }

  // Create another uncommitted box (should work if the first was properly declined)
  const box2Id = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'SecondAttempt' })).result
  console.log('[07] second create result:', box2Id)

  return { partId }
}
