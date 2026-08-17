export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RemovalTest' })).result

  // Set 5 keys
  await api.v1.common.setUserData({ id: partId, key: 'alpha', value: 'a' })
  await api.v1.common.setUserData({ id: partId, key: 'beta', value: 'b' })
  await api.v1.common.setUserData({ id: partId, key: 'gamma', value: 'c' })
  await api.v1.common.setUserData({ id: partId, key: 'delta', value: 'd' })
  await api.v1.common.setUserData({ id: partId, key: 'epsilon', value: 'e' })

  const keysBefore = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[04] before removal:', JSON.stringify(keysBefore))

  // Remove middle key
  await api.v1.common.removeUserData({ id: partId, key: 'gamma' })
  const keysAfterRemove = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[04] after removing gamma:', JSON.stringify(keysAfterRemove))

  // Clear all
  await api.v1.common.clearUserData({ id: partId })
  const keysAfterClear = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[04] after clearUserData:', JSON.stringify(keysAfterClear))

  filewrite({ keysBefore, keysAfterRemove, keysAfterClear }, 'removal-response')

  return { partId }
}
