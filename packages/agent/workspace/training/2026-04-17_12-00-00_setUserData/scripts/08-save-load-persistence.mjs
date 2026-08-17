export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PersistTest' })).result

  // Set some user data
  await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  await api.v1.common.setUserData({ id: partId, key: 'author', value: 'cc-agent' })
  await api.v1.common.setUserData({ id: partId, key: 'version', value: '1.0' })

  // Also set on a sub-object (entity injection)
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  await api.v1.common.setUserData({ id: eifId, key: 'feature-meta', value: 'test-eif' })
  await api.v1.common.setUserData({ id: boxId, key: 'solid-meta', value: 'test-solid' })

  // Verify before save
  const beforePart = (await api.v1.common.getUserDataKeys({ id: partId })).result
  const beforeEif = (await api.v1.common.getUserDataKeys({ id: eifId })).result
  const beforeBox = (await api.v1.common.getUserDataKeys({ id: boxId })).result
  console.log('[08] before save — part keys:', JSON.stringify(beforePart))
  console.log('[08] before save — eif keys:', JSON.stringify(beforeEif))
  console.log('[08] before save — box keys:', JSON.stringify(beforeBox))

  // Save
  const saveR = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const savedContent = saveR.result.content
  console.log('[08] saved OFB, length:', savedContent.length)

  // Clear and reload
  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({ data: savedContent, format: 'OFB', encoding: 'base64' })
  const newPartId = loadR.result.id
  console.log('[08] loaded, new partId:', newPartId)

  // Check if user data survived — note: IDs may have changed
  const afterPartKeys = (await api.v1.common.getUserDataKeys({ id: newPartId })).result
  console.log('[08] after load — part keys:', JSON.stringify(afterPartKeys))

  const afterMaterial = (await api.v1.common.getUserData({ id: newPartId, key: 'material', defaultValue: 'MISSING' })).result
  const afterAuthor = (await api.v1.common.getUserData({ id: newPartId, key: 'author', defaultValue: 'MISSING' })).result
  console.log('[08] after load — material:', JSON.stringify(afterMaterial), 'author:', JSON.stringify(afterAuthor))

  filewrite({
    beforePart, beforeEif, beforeBox,
    afterPartKeys, afterMaterial, afterAuthor,
    newPartId,
  }, 'persistence')

  return { partId: newPartId }
}
