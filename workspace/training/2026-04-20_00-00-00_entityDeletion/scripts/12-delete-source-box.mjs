export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteSource' })).result

  const box = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 20, height: 20 })).result
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [1, 0, 0] })).result

  const pattern = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [box],
    dir1: { references: [wa], distance: 40, count: 3 }
  })).result
  console.log('[12] box:', box, 'pattern:', pattern)

  await snapshot('before')

  // Delete the SOURCE box feature — NOT the pattern
  // What happens to the pattern instances?
  const r = await api.v1.part.entityDeletion({ id: partId, name: 'Del1', targets: [box] })
  console.log('[12] del source box result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'source-deletion-response')

  await snapshot('after-delete-source')

  return { partId }
}
