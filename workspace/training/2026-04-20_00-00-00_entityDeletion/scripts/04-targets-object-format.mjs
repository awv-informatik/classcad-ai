export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ObjFormat' })).result

  const box = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 20, height: 20 })).result
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [1, 0, 0] })).result

  const pattern = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [box],
    dir1: { references: [wa], distance: 40, count: 4 }
  })).result
  console.log('[04] pattern:', pattern)

  await snapshot('before')

  // Targets as objects with id but NO indices — should delete ALL solids of the pattern
  const r = await api.v1.part.entityDeletion({
    id: partId, name: 'DelAll',
    targets: [{ id: pattern }]
  })
  console.log('[04] entityDeletion result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'obj-format-response')

  await snapshot('after-delete-pattern-no-indices')

  return { partId, box, pattern, delId: r.result }
}
