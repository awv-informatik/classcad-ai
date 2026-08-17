export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DefaultsTest' })).result

  // Get from nonexistent key with no default
  const r1 = await api.v1.common.getUserData({ id: partId, key: 'nope' })
  console.log('[11] no default — result:', JSON.stringify(r1.result), 'type:', typeof r1.result, 'maxLevel:', r1.maxLevel)

  // Get from nonexistent key with default
  const r2 = await api.v1.common.getUserData({ id: partId, key: 'nope', defaultValue: 'fallback' })
  console.log('[11] with default — result:', JSON.stringify(r2.result), 'type:', typeof r2.result)

  // Get from nonexistent key with empty string default
  const r3 = await api.v1.common.getUserData({ id: partId, key: 'nope', defaultValue: '' })
  console.log('[11] empty default — result:', JSON.stringify(r3.result), 'type:', typeof r3.result)

  // Set a key then get with wrong key name (case sensitivity)
  await api.v1.common.setUserData({ id: partId, key: 'Material', value: 'steel' })
  const r4 = await api.v1.common.getUserData({ id: partId, key: 'material', defaultValue: 'WRONG_CASE' })
  const r5 = await api.v1.common.getUserData({ id: partId, key: 'Material' })
  console.log('[11] case sensitive? "material":', JSON.stringify(r4.result), '"Material":', JSON.stringify(r5.result))

  // getUserDataKeys on object with no user data
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const r6 = await api.v1.common.getUserDataKeys({ id: eifId })
  console.log('[11] keys on empty:', JSON.stringify(r6.result), 'maxLevel:', r6.maxLevel)

  filewrite({
    noDefault: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    withDefault: { result: r2.result },
    emptyDefault: { result: r3.result },
    caseSensitive: { lowercase: r4.result, uppercase: r5.result },
    emptyKeys: { result: r6.result },
  }, 'defaults')

  return { partId }
}
