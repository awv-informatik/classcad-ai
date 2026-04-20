export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Set initial value
  await api.v1.common.setUserData({ id: partId, key: 'version', value: 'v1' })
  const v1 = (await api.v1.common.getUserData({ id: partId, key: 'version' })).result
  console.log('[05] initial:', v1)

  // Try overwrite without remove (known no-op)
  await api.v1.common.setUserData({ id: partId, key: 'version', value: 'v2' })
  const stillV1 = (await api.v1.common.getUserData({ id: partId, key: 'version' })).result
  console.log('[05] after direct overwrite attempt:', stillV1)

  // Proper update: remove then set
  await api.v1.common.removeUserData({ id: partId, key: 'version' })
  await api.v1.common.setUserData({ id: partId, key: 'version', value: 'v2' })
  const v2 = (await api.v1.common.getUserData({ id: partId, key: 'version' })).result
  console.log('[05] after remove+set:', v2)

  filewrite({ initial: v1, afterDirectOverwrite: stillV1, afterRemoveAndSet: v2 }, 'update-pattern')

  return { partId }
}
