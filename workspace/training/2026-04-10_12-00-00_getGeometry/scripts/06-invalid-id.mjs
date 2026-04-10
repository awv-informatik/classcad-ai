// Test getGeometry with invalid IDs — part ID, non-existent ID, etc.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Test with part ID (wrong type)
  const r1 = await api.v1.sketch.getGeometry({ id: partId })
  console.log('[06] partId result:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  console.log('[06] partId messages:', JSON.stringify(r1.messages))

  // Test with non-existent ID
  const r2 = await api.v1.sketch.getGeometry({ id: 99999 })
  console.log('[06] nonexistent result:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  console.log('[06] nonexistent messages:', JSON.stringify(r2.messages))

  // Test with no id param
  try {
    const r3 = await api.v1.sketch.getGeometry({})
    console.log('[06] no-id result:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
    console.log('[06] no-id messages:', JSON.stringify(r3.messages))
  } catch (e) {
    console.log('[06] no-id threw:', e.message)
  }

  filewrite({
    partId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    nonexistent: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'invalid-ids')

  return { partId, skId }
}
