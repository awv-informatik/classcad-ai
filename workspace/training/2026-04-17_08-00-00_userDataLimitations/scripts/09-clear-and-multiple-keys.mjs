export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ClearTest' })).result

  // Set many keys
  for (let i = 0; i < 20; i++) {
    await api.v1.common.setUserData({ id: partId, key: `key_${i}`, value: `val_${i}` })
  }
  const keysBefore = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[09] keys before clear:', keysBefore.length)

  // Clear all
  const cr = await api.v1.common.clearUserData({ id: partId })
  console.log('[09] clearUserData: maxLevel=', cr.maxLevel)

  const keysAfter = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[09] keys after clear:', keysAfter.length, keysAfter)

  // Verify individual key is gone
  const g = (await api.v1.common.getUserData({ id: partId, key: 'key_0', defaultValue: 'GONE' })).result
  console.log('[09] key_0 after clear:', g)

  // Set a new key after clearing
  await api.v1.common.setUserData({ id: partId, key: 'fresh', value: 'data' })
  const freshKeys = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[09] keys after fresh set:', freshKeys)

  // Test removeUserData on one of many keys
  for (let i = 0; i < 5; i++) {
    await api.v1.common.setUserData({ id: partId, key: `multi_${i}`, value: `val_${i}` })
  }
  const multiKeys1 = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[09] multi keys before remove:', multiKeys1)

  await api.v1.common.removeUserData({ id: partId, key: 'multi_2' })
  const multiKeys2 = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[09] multi keys after removing multi_2:', multiKeys2)

  filewrite({
    beforeClear: keysBefore.length,
    afterClear: keysAfter,
    afterFreshSet: freshKeys,
    multiKeysBeforeRemove: multiKeys1,
    multiKeysAfterRemove: multiKeys2,
  }, 'clear-results')

  return { partId }
}
