export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Test: what does defaultValue accept?
  // Docs say defaultValue is a string, but let's probe edge cases

  // String default (normal)
  const r1 = await api.v1.common.getUserData({ id: partId, key: 'x', defaultValue: 'fallback' })
  console.log('[07] string default:', JSON.stringify(r1.result), 'type:', typeof r1.result)

  // Empty string default
  const r2 = await api.v1.common.getUserData({ id: partId, key: 'x', defaultValue: '' })
  console.log('[07] empty string default:', JSON.stringify(r2.result), 'type:', typeof r2.result)

  // Number as default
  const r3 = await api.v1.common.getUserData({ id: partId, key: 'x', defaultValue: 42 })
  console.log('[07] number default:', JSON.stringify(r3.result), 'type:', typeof r3.result, 'maxLevel:', r3.maxLevel)

  // Boolean as default
  const r4 = await api.v1.common.getUserData({ id: partId, key: 'x', defaultValue: true })
  console.log('[07] boolean default:', JSON.stringify(r4.result), 'type:', typeof r4.result, 'maxLevel:', r4.maxLevel)

  // null as default
  const r5 = await api.v1.common.getUserData({ id: partId, key: 'x', defaultValue: null })
  console.log('[07] null default:', JSON.stringify(r5.result), 'type:', typeof r5.result, 'maxLevel:', r5.maxLevel)

  filewrite({
    stringDefault: { result: r1.result, type: typeof r1.result, maxLevel: r1.maxLevel },
    emptyStringDefault: { result: r2.result, type: typeof r2.result, maxLevel: r2.maxLevel },
    numberDefault: { result: r3.result, type: typeof r3.result, maxLevel: r3.maxLevel },
    booleanDefault: { result: r4.result, type: typeof r4.result, maxLevel: r4.maxLevel },
    nullDefault: { result: r5.result, type: typeof r5.result, maxLevel: r5.maxLevel },
  }, 'default-value-types')

  return { partId }
}
