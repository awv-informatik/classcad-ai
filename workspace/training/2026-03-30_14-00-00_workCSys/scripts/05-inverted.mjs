// Test: inverted param — what does it do?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Normal CSys
  const r1 = await api.v1.part.workCSys({
    id: partId, name: 'CS_normal',
    offset: [40, 30, 20]
  })
  console.log('[05] normal result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Inverted CSys at same position
  const r2 = await api.v1.part.workCSys({
    id: partId, name: 'CS_inverted',
    offset: [40, 30, 20],
    inverted: true
  })
  console.log('[05] inverted result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Dump structure to compare the two
  filewrite(r2.structure, 'structure-with-both')

  filewrite({
    normal: { result: r1.result, maxLevel: r1.maxLevel },
    inverted: { result: r2.result, maxLevel: r2.maxLevel }
  }, 'inverted-responses')

  await snapshot('inverted')
  return { partId }
}
