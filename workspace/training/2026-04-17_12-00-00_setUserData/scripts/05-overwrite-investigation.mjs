export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OverwriteTest' })).result

  // Set initial value
  await api.v1.common.setUserData({ id: partId, key: 'mat', value: 'steel' })
  const v1 = (await api.v1.common.getUserData({ id: partId, key: 'mat' })).result
  console.log('[05] initial:', JSON.stringify(v1))

  // Try to overwrite
  const r2 = await api.v1.common.setUserData({ id: partId, key: 'mat', value: 'aluminum' })
  const v2 = (await api.v1.common.getUserData({ id: partId, key: 'mat' })).result
  console.log('[05] after overwrite attempt:', JSON.stringify(v2), 'maxLevel:', r2.maxLevel)
  console.log('[05] messages:', JSON.stringify(r2.messages))

  // Workaround: remove then re-set
  const removeR = await api.v1.common.removeUserData({ id: partId, key: 'mat' })
  console.log('[05] removeUserData result:', removeR.result, 'maxLevel:', removeR.maxLevel)

  const v3 = (await api.v1.common.getUserData({ id: partId, key: 'mat', defaultValue: 'GONE' })).result
  console.log('[05] after remove:', JSON.stringify(v3))

  await api.v1.common.setUserData({ id: partId, key: 'mat', value: 'aluminum' })
  const v4 = (await api.v1.common.getUserData({ id: partId, key: 'mat' })).result
  console.log('[05] after remove+re-set:', JSON.stringify(v4))

  filewrite({ v1, v2, v3, v4 }, 'overwrite-investigation')
  return { partId }
}
