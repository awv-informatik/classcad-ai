export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Missing key param
  const r1 = await api.v1.common.removeUserData({ id: partId })
  console.log('[03] missing key result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'missing-key-response')

  // Nonexistent ID
  const r2 = await api.v1.common.removeUserData({ id: 'ZZZZ_FAKE_ID', key: 'material' })
  console.log('[03] fake id result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'fake-id-response')

  // ID = 0
  const r3 = await api.v1.common.removeUserData({ id: 0, key: 'material' })
  console.log('[03] id=0 result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'zero-id-response')

  // Empty key
  const r4 = await api.v1.common.removeUserData({ id: partId, key: '' })
  console.log('[03] empty key result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'empty-key-response')

  return { partId }
}
