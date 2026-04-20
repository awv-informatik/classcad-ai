export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoercionWorkaround' })).result

  // Workaround: manually convert to string
  await api.v1.common.setUserData({ id: partId, key: 'count', value: String(42) })
  await api.v1.common.setUserData({ id: partId, key: 'pi', value: String(3.14159) })
  await api.v1.common.setUserData({ id: partId, key: 'flag', value: String(true) })
  await api.v1.common.setUserData({ id: partId, key: 'json', value: JSON.stringify({ nested: true, count: 42 }) })

  const count = (await api.v1.common.getUserData({ id: partId, key: 'count' })).result
  const pi = (await api.v1.common.getUserData({ id: partId, key: 'pi' })).result
  const flag = (await api.v1.common.getUserData({ id: partId, key: 'flag' })).result
  const json = (await api.v1.common.getUserData({ id: partId, key: 'json' })).result

  console.log('[13] count:', JSON.stringify(count), '→', Number(count))
  console.log('[13] pi:', JSON.stringify(pi), '→', Number(pi))
  console.log('[13] flag:', JSON.stringify(flag), '→', flag === 'true')
  console.log('[13] json:', JSON.stringify(json), '→', JSON.parse(json))

  const allKeys = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[13] all keys:', JSON.stringify(allKeys))

  filewrite({ count, pi, flag, json, allKeys }, 'coercion-workaround')

  return { partId }
}
