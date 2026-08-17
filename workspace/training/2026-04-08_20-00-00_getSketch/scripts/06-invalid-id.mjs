// Test getSketch with invalid/non-existent IDs and missing params
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Non-existent numeric ID
  const r1 = await api.v1.part.getSketch({ id: 99999, name: 'Sk1' })
  console.log('[06] bogus id — result:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // ID = 0
  const r2 = await api.v1.part.getSketch({ id: 0, name: 'Sk1' })
  console.log('[06] id=0 — result:', r2.result, 'maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Missing id param
  const r3 = await api.v1.part.getSketch({ name: 'Sk1' })
  console.log('[06] no id — result:', r3.result, 'maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  // Missing name param
  const r4 = await api.v1.part.getSketch({ id: partId })
  console.log('[06] no name — result:', r4.result, 'maxLevel:', r4.maxLevel, 'messages:', JSON.stringify(r4.messages))

  // Both missing
  const r5 = await api.v1.part.getSketch({})
  console.log('[06] both missing — result:', r5.result, 'maxLevel:', r5.maxLevel, 'messages:', JSON.stringify(r5.messages))

  filewrite({
    bogusId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    zeroId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    noId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    noName: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    bothMissing: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'invalid-id-response')

  return { partId }
}
