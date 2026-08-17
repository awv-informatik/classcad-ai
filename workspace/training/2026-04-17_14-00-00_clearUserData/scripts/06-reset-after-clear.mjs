export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ResetTest' })).result
  console.log('[06] partId:', partId)

  // Set keys
  await api.v1.common.setUserData({ id: partId, key: 'a', value: '1' })
  await api.v1.common.setUserData({ id: partId, key: 'b', value: '2' })

  // Clear all
  await api.v1.common.clearUserData({ id: partId })
  const keysAfterClear = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[06] after clear:', JSON.stringify(keysAfterClear))

  // Re-set same keys with new values
  const s1 = await api.v1.common.setUserData({ id: partId, key: 'a', value: 'new1' })
  const s2 = await api.v1.common.setUserData({ id: partId, key: 'b', value: 'new2' })
  console.log('[06] re-set a:', s1.maxLevel, 'b:', s2.maxLevel)

  const keysAfterReset = (await api.v1.common.getUserDataKeys({ id: partId })).result
  const valA = (await api.v1.common.getUserData({ id: partId, key: 'a' })).result
  const valB = (await api.v1.common.getUserData({ id: partId, key: 'b' })).result
  console.log('[06] after re-set — keys:', JSON.stringify(keysAfterReset), 'a:', valA, 'b:', valB)

  filewrite({
    keysAfterClear,
    keysAfterReset,
    valA, valB,
  }, 'reset-after-clear-response')

  return { partId }
}
