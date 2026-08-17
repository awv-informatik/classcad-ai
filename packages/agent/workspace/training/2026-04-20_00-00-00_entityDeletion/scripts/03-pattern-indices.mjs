export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PatternIndices' })).result

  // Create a box feature
  const box = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 20, height: 20 })).result
  console.log('[03] box:', box)

  // Create a work axis for the pattern direction
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [1, 0, 0] })).result
  console.log('[03] workAxis:', wa)

  // Create a linear pattern: 5 copies along X
  const pattern = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [box],
    dir1: { references: [wa], distance: 40, count: 5 }
  })).result
  console.log('[03] pattern:', pattern)

  await snapshot('before-pattern-5')

  // Delete instances 1 and 3 (0-based?) from the pattern
  const r = await api.v1.part.entityDeletion({
    id: partId, name: 'DelPattern',
    targets: [{ id: pattern, indices: [1, 3] }]
  })
  console.log('[03] entityDeletion result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'pattern-deletion-response')

  await snapshot('after-delete-indices-1-3')

  return { partId, box, pattern, delId: r.result }
}
