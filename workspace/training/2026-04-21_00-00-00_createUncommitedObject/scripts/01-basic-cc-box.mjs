export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UncommitTest' })).result

  // Create an uncommitted CC_Box
  const r = await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'EmptyBox' })
  console.log('[01] createUncommitedObject result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'create-response')

  // Check if it appears in the structure tree
  filewrite(r.structure, 'structure-after-create')

  // Try to get the feature by name
  const getR = await api.v1.part.getFeature({ id: partId, name: 'EmptyBox' })
  console.log('[01] getFeature result:', getR.result, 'maxLevel:', getR.maxLevel)

  // Try snapshot to see if there's any geometry
  await snapshot('after-uncommitted-box')

  return { partId, uncommittedId: r.result }
}
