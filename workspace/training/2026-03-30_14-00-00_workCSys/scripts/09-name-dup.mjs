// Test: name param — duplicates, empty string
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r1 = await api.v1.part.workCSys({ id: partId, name: 'MyCSys' })
  const r2 = await api.v1.part.workCSys({ id: partId, name: 'MyCSys' })  // duplicate
  const r3 = await api.v1.part.workCSys({ id: partId, name: '' })  // empty

  console.log('[09] first:', r1.result, r1.maxLevel)
  console.log('[09] dup:', r2.result, r2.maxLevel)
  console.log('[09] empty:', r3.result, r3.maxLevel)

  const found = await api.v1.part.getWorkGeometry({ id: partId, name: 'MyCSys' })
  console.log('[09] getWorkGeometry MyCSys:', found.result)

  filewrite({
    first: { result: r1.result, maxLevel: r1.maxLevel },
    dup: { result: r2.result, maxLevel: r2.maxLevel },
    empty: { result: r3.result, maxLevel: r3.maxLevel },
    found: found.result
  }, 'name-responses')

  return { partId }
}
