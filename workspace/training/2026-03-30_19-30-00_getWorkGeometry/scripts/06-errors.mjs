// Test error cases: non-existent name, empty string, missing params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GWGTest' })).result

  // Non-existent name
  const r1 = await api.v1.part.getWorkGeometry({ id: partId, name: 'DoesNotExist' })
  console.log('[06] non-existent → result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[06] messages:', JSON.stringify(r1.messages))

  // Empty string name
  const r2 = await api.v1.part.getWorkGeometry({ id: partId, name: '' })
  console.log('[06] empty string → result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[06] messages:', JSON.stringify(r2.messages))

  // Missing name param
  const r3 = await api.v1.part.getWorkGeometry({ id: partId })
  console.log('[06] missing name → result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[06] messages:', JSON.stringify(r3.messages))

  // Invalid part ID
  const r4 = await api.v1.part.getWorkGeometry({ id: 'bogus', name: 'Top' })
  console.log('[06] bogus id → result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[06] messages:', JSON.stringify(r4.messages))

  filewrite({
    nonExistent: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    emptyString: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    missingName: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    bogusId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }
  }, 'errors')

  return { partId }
}
