export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AllIndices' })).result

  const box = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 20, height: 20 })).result
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [1, 0, 0] })).result

  const pattern = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [box],
    dir1: { references: [wa], distance: 40, count: 4 }
  })).result

  await snapshot('before')

  // Delete ALL indices explicitly: 0, 1, 2, 3
  const r = await api.v1.part.entityDeletion({
    id: partId, name: 'DelAll',
    targets: [{ id: pattern, indices: [0, 1, 2, 3] }]
  })
  console.log('[10] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-all-response')

  await snapshot('after-all-deleted')

  return { partId }
}
