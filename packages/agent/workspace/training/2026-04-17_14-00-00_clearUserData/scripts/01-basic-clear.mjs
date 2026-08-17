export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ClearTest' })).result
  console.log('[01] partId:', partId)

  // Set multiple keys
  await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  await api.v1.common.setUserData({ id: partId, key: 'color', value: 'blue' })
  await api.v1.common.setUserData({ id: partId, key: 'version', value: '3' })

  // Verify keys exist
  const keysBefore = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[01] keys before clear:', JSON.stringify(keysBefore))

  // Clear all user data
  const r = await api.v1.common.clearUserData({ id: partId })
  console.log('[01] clearUserData result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] clearUserData messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'clear-response')

  // Verify keys are gone
  const keysAfter = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[01] keys after clear:', JSON.stringify(keysAfter))

  // Verify individual keys return default
  const mat = (await api.v1.common.getUserData({ id: partId, key: 'material', defaultValue: '__GONE__' })).result
  console.log('[01] material after clear:', mat)

  return { partId, keysBefore, keysAfter, clearResult: r.result, clearMaxLevel: r.maxLevel }
}
