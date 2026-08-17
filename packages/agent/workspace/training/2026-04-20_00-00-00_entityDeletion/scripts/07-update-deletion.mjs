export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateDeletion' })).result

  const box = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 20, height: 20 })).result
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [1, 0, 0] })).result

  const pattern = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [box],
    dir1: { references: [wa], distance: 40, count: 5 }
  })).result

  // Delete indices 1 and 3
  const delId = (await api.v1.part.entityDeletion({
    id: partId, name: 'Del1',
    targets: [{ id: pattern, indices: [1, 3] }]
  })).result
  console.log('[07] delId:', delId)

  await snapshot('after-initial-deletion')

  // Now update: change to delete indices 0 and 4 instead
  await api.v1.part.openFeature({ id: delId })
  const r = await api.v1.part.updateEntityDeletion({
    id: delId,
    targets: [{ id: pattern, indices: [0, 4] }]
  })
  await api.v1.part.closeFeature({ id: delId })
  console.log('[07] updateEntityDeletion result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-response')

  await snapshot('after-update-indices-0-4')

  return { partId, delId }
}
