export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Set several keys
  await api.v1.common.setUserData({ id: partId, key: 'a', value: '1' })
  await api.v1.common.setUserData({ id: partId, key: 'b', value: '2' })
  await api.v1.common.setUserData({ id: partId, key: 'c', value: '3' })
  await api.v1.common.setUserData({ id: partId, key: 'd', value: '4' })

  const keysBefore = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[04] keys before:', keysBefore)

  // Remove middle keys
  await api.v1.common.removeUserData({ id: partId, key: 'b' })
  await api.v1.common.removeUserData({ id: partId, key: 'c' })

  const keysAfter = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[04] keys after removing b,c:', keysAfter)

  // Verify remaining values are intact
  const a = (await api.v1.common.getUserData({ id: partId, key: 'a' })).result
  const d = (await api.v1.common.getUserData({ id: partId, key: 'd' })).result
  const b = (await api.v1.common.getUserData({ id: partId, key: 'b', defaultValue: '__GONE__' })).result
  console.log('[04] a:', a, 'd:', d, 'b (removed):', b)

  filewrite({ keysBefore, keysAfter, remaining: { a, d }, removed: { b } }, 'multiple-keys')

  return { partId }
}
