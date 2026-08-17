export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Set user data
  await api.v1.common.setUserData({ id: partId, key: 'before-save', value: 'hello' })

  // Save to OFB
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result

  // Read before clear
  const beforeClear = (await api.v1.common.getUserData({ id: partId, key: 'before-save' })).result
  console.log('[13] before clear:', beforeClear)

  // Clear and reload
  await api.v1.common.clear({})
  const loadRes = (await api.v1.common.load({ data: saveRes.content, format: 'OFB', encoding: 'base64' })).result
  const newPartId = loadRes.id
  console.log('[13] loaded, new partId:', newPartId)

  // Check if user data survived the save/load cycle
  const afterLoad = await api.v1.common.getUserData({ id: newPartId, key: 'before-save', defaultValue: '__LOST__' })
  console.log('[13] after load:', afterLoad.result)

  filewrite({
    beforeClear,
    newPartId,
    afterLoad: afterLoad.result,
    dataPersisted: afterLoad.result !== '__LOST__',
  }, 'save-load-persistence')

  return { partId: newPartId }
}
