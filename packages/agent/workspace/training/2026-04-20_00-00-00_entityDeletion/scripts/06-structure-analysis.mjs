export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructAnalysis' })).result

  const box = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 20, height: 20 })).result
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [1, 0, 0] })).result

  const patternR = await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [box],
    dir1: { references: [wa], distance: 40, count: 4 }
  })
  const pattern = patternR.result
  console.log('[06] box:', box, 'pattern:', pattern)
  filewrite(patternR.structure, 'structure-before')

  await snapshot('before')

  // Delete pattern as plain ID (all solids)
  const r1 = await api.v1.part.entityDeletion({ id: partId, name: 'Del1', targets: [pattern] })
  console.log('[06] del plain ID result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite(r1.structure, 'structure-after-plain-id')

  await snapshot('after-plain-id')

  return { partId }
}
