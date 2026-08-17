export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UserDataTest' })).result

  // Set user data
  const setR = await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  console.log('[01] setUserData result:', setR.result, 'maxLevel:', setR.maxLevel)
  filewrite({ result: setR.result, messages: setR.messages, maxLevel: setR.maxLevel }, 'set-response')

  // Get it back
  const getR = await api.v1.common.getUserData({ id: partId, key: 'material' })
  console.log('[01] getUserData result:', JSON.stringify(getR.result), 'maxLevel:', getR.maxLevel)
  filewrite({ result: getR.result, messages: getR.messages, maxLevel: getR.maxLevel }, 'get-response')

  // List keys
  const keysR = await api.v1.common.getUserDataKeys({ id: partId })
  console.log('[01] getUserDataKeys result:', JSON.stringify(keysR.result), 'maxLevel:', keysR.maxLevel)
  filewrite({ result: keysR.result, messages: keysR.messages, maxLevel: keysR.maxLevel }, 'keys-response')

  return { partId }
}
