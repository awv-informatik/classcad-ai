export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Set a key
  const setR = await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  console.log('[01] set result:', setR.result, 'maxLevel:', setR.maxLevel)

  // Verify it's there
  const getR = await api.v1.common.getUserData({ id: partId, key: 'material' })
  console.log('[01] get before remove:', getR.result, 'maxLevel:', getR.maxLevel)

  // Remove it
  const removeR = await api.v1.common.removeUserData({ id: partId, key: 'material' })
  console.log('[01] remove result:', removeR.result, 'maxLevel:', removeR.maxLevel)
  filewrite({ result: removeR.result, messages: removeR.messages, maxLevel: removeR.maxLevel }, 'remove-response')

  // Verify it's gone
  const getAfter = await api.v1.common.getUserData({ id: partId, key: 'material', defaultValue: '__MISSING__' })
  console.log('[01] get after remove:', getAfter.result, 'maxLevel:', getAfter.maxLevel)

  return { partId }
}
