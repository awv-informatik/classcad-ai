export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EITest' })).result
  const eiId = (await api.v1.part.entityInjection({ id: partId })).result
  console.log('[09] partId:', partId, 'eiId:', eiId)

  // Set user data on the entity injection
  await api.v1.common.setUserData({ id: eiId, key: 'source', value: 'injected' })
  const getR = await api.v1.common.getUserData({ id: eiId, key: 'source' })
  console.log('[09] get from EI:', getR.result, 'maxLevel:', getR.maxLevel)

  // Remove from EI
  const removeR = await api.v1.common.removeUserData({ id: eiId, key: 'source' })
  console.log('[09] remove from EI — result:', removeR.result, 'maxLevel:', removeR.maxLevel)

  // Verify gone
  const afterR = await api.v1.common.getUserData({ id: eiId, key: 'source', defaultValue: '__GONE__' })
  console.log('[09] after remove from EI:', afterR.result)

  // Also test on part simultaneously — confirm isolation
  await api.v1.common.setUserData({ id: partId, key: 'source', value: 'part-val' })
  const partVal = await api.v1.common.getUserData({ id: partId, key: 'source' })
  console.log('[09] part still has source:', partVal.result)

  filewrite({ eiGet: getR.result, eiRemove: removeR.maxLevel, eiAfter: afterR.result, partStill: partVal.result }, 'ei-isolation')

  return { partId, eiId }
}
