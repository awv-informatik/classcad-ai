// 10 — part.sketch with empty string name and various edge cases
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Empty string name
  const r1 = await api.v1.part.sketch({ id: partId, name: '' })
  console.log('[10] empty name — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Very long name
  const longName = 'A'.repeat(200)
  const r2 = await api.v1.part.sketch({ id: partId, name: longName })
  console.log('[10] long name — result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Name with special characters
  const r3 = await api.v1.part.sketch({ id: partId, name: 'Sketch/Test (1)' })
  console.log('[10] special chars — result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Numeric name
  const r4 = await api.v1.part.sketch({ id: partId, name: '42' })
  console.log('[10] numeric name — result:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    emptyName: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    longName: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    specialChars: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    numericName: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'name-edge-cases')

  return { partId, emptyId: r1.result, longId: r2.result, specialId: r3.result, numericId: r4.result }
}
