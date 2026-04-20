export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EntityDeletionTest' })).result

  // Create a WCS to offset the second box
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 30, width: 30, height: 50, references: [wcs] })).result
  console.log('[01] box1:', box1, 'box2:', box2)

  await snapshot('before')

  // Delete box2 using entityDeletion — targets as plain IDs
  const r = await api.v1.part.entityDeletion({ id: partId, name: 'Del1', targets: [box2] })
  console.log('[01] entityDeletion result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'deletion-response')

  await snapshot('after-delete-box2')

  return { partId, box1, box2, delId: r.result }
}
