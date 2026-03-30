// Test: name param — duplicates, empty string, special chars
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Default name
  const r1 = await api.v1.part.workAxis({ id: partId })
  console.log('[08] default name result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Second with same default name — duplicate
  const r2 = await api.v1.part.workAxis({ id: partId })
  console.log('[08] dup default result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Custom name
  const r3 = await api.v1.part.workAxis({ id: partId, name: 'MyAxis' })
  console.log('[08] custom name result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Duplicate custom name
  const r4 = await api.v1.part.workAxis({ id: partId, name: 'MyAxis' })
  console.log('[08] dup custom result:', r4.result, 'maxLevel:', r4.maxLevel)

  // Empty string name
  const r5 = await api.v1.part.workAxis({ id: partId, name: '' })
  console.log('[08] empty name result:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[08] empty name msgs:', JSON.stringify(r5.messages))

  // Check getWorkGeometry finds the first by name
  const found = await api.v1.part.getWorkGeometry({ id: partId, name: 'MyAxis' })
  console.log('[08] getWorkGeometry MyAxis:', found.result)

  filewrite({
    default1: { result: r1.result, maxLevel: r1.maxLevel },
    default2: { result: r2.result, maxLevel: r2.maxLevel },
    custom1: { result: r3.result, maxLevel: r3.maxLevel },
    custom2: { result: r4.result, maxLevel: r4.maxLevel },
    empty: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
    getByName: { result: found.result }
  }, 'name-responses')

  return { partId }
}
