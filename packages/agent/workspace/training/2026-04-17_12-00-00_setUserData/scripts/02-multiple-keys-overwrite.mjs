export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiKeyTest' })).result

  // Set multiple keys
  await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  await api.v1.common.setUserData({ id: partId, key: 'color', value: 'red' })
  await api.v1.common.setUserData({ id: partId, key: 'weight', value: '42.5' })

  const keys1 = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[02] keys after 3 sets:', JSON.stringify(keys1))

  // Overwrite an existing key
  const overwriteR = await api.v1.common.setUserData({ id: partId, key: 'material', value: 'aluminum' })
  console.log('[02] overwrite result:', overwriteR.result, 'maxLevel:', overwriteR.maxLevel)

  const newVal = (await api.v1.common.getUserData({ id: partId, key: 'material' })).result
  console.log('[02] after overwrite:', JSON.stringify(newVal))

  // Keys unchanged (still 3, not 4)
  const keys2 = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[02] keys after overwrite:', JSON.stringify(keys2))

  filewrite({ keys1, newVal, keys2 }, 'overwrite-check')

  return { partId }
}
