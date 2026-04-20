export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SolidTest' })).result
  const boxId = (await api.v1.solid.box({ id: partId, xLen: 50, yLen: 50, zLen: 50 })).result
  console.log('[08] partId:', partId, 'boxId:', boxId)

  // Try setUserData on the solid body and check the response
  const setR = await api.v1.common.setUserData({ id: boxId, key: 'tag', value: 'box-tag' })
  console.log('[08] set on solid — result:', setR.result, 'maxLevel:', setR.maxLevel)
  filewrite({ result: setR.result, messages: setR.messages, maxLevel: setR.maxLevel }, 'set-on-solid-response')

  // Try getUserData on the solid body
  const getR = await api.v1.common.getUserData({ id: boxId, key: 'tag', defaultValue: '__MISSING__' })
  console.log('[08] get from solid — result:', getR.result, 'maxLevel:', getR.maxLevel)
  filewrite({ result: getR.result, messages: getR.messages, maxLevel: getR.maxLevel }, 'get-from-solid-response')

  // Try getUserDataKeys on the solid body
  const keysR = await api.v1.common.getUserDataKeys({ id: boxId })
  console.log('[08] keys on solid — result:', keysR.result, 'maxLevel:', keysR.maxLevel)

  // Try removeUserData on the solid body
  const removeR = await api.v1.common.removeUserData({ id: boxId, key: 'tag' })
  console.log('[08] remove from solid — result:', removeR.result, 'maxLevel:', removeR.maxLevel)
  filewrite({ result: removeR.result, messages: removeR.messages, maxLevel: removeR.maxLevel }, 'remove-from-solid-response')

  return { partId, boxId }
}
