export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RemoveClearTest' })).result

  // Set several keys
  await api.v1.common.setUserData({ id: partId, key: 'a', value: '1' })
  await api.v1.common.setUserData({ id: partId, key: 'b', value: '2' })
  await api.v1.common.setUserData({ id: partId, key: 'c', value: '3' })

  const keysBefore = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[10] before remove:', JSON.stringify(keysBefore))

  // Remove single key
  const removeR = await api.v1.common.removeUserData({ id: partId, key: 'b' })
  console.log('[10] removeUserData result:', removeR.result, 'maxLevel:', removeR.maxLevel)

  const keysAfterRemove = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[10] after remove "b":', JSON.stringify(keysAfterRemove))

  // Remove non-existent key
  const removeNonExist = await api.v1.common.removeUserData({ id: partId, key: 'nonexistent' })
  console.log('[10] remove nonexistent: result:', removeNonExist.result, 'maxLevel:', removeNonExist.maxLevel)
  console.log('[10] remove nonexistent messages:', JSON.stringify(removeNonExist.messages))

  // Clear all
  const clearR = await api.v1.common.clearUserData({ id: partId })
  console.log('[10] clearUserData result:', clearR.result, 'maxLevel:', clearR.maxLevel)

  const keysAfterClear = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[10] after clear:', JSON.stringify(keysAfterClear))

  // Clear on already-empty
  const clearEmpty = await api.v1.common.clearUserData({ id: partId })
  console.log('[10] clear on empty: result:', clearEmpty.result, 'maxLevel:', clearEmpty.maxLevel)

  filewrite({
    keysBefore, keysAfterRemove, keysAfterClear,
    removeNonExist: { result: removeNonExist.result, maxLevel: removeNonExist.maxLevel, messages: removeNonExist.messages },
    clearEmpty: { result: clearEmpty.result, maxLevel: clearEmpty.maxLevel },
  }, 'remove-clear')

  return { partId }
}
