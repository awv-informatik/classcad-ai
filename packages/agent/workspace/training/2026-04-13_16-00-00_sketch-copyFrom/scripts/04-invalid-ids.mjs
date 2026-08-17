// Test copyFrom with invalid IDs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyFromInvalid' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Invalid toCopyId
  const r1 = await api.v1.sketch.copyFrom({ id: skId, toCopyId: 99999 })
  console.log('[04] invalid toCopyId result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] invalid toCopyId messages:', JSON.stringify(r1.messages))

  // Invalid id (destination)
  const r2 = await api.v1.sketch.copyFrom({ id: 99999, toCopyId: skId })
  console.log('[04] invalid id result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[04] invalid id messages:', JSON.stringify(r2.messages))

  // Both invalid
  const r3 = await api.v1.sketch.copyFrom({ id: 99999, toCopyId: 88888 })
  console.log('[04] both invalid result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    invalidToCopyId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    invalidId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    bothInvalid: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  }, 'invalid-ids-responses')

  return { partId }
}
