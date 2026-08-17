export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeysTest' })).result

  // Set a few keys
  await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  await api.v1.common.setUserData({ id: partId, key: 'color', value: 'blue' })
  await api.v1.common.setUserData({ id: partId, key: 'version', value: '3' })

  // Get keys
  const r = await api.v1.common.getUserDataKeys({ id: partId })
  console.log('[01] result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] result type:', typeof r.result, Array.isArray(r.result) ? '(array)' : '')
  console.log('[01] length:', r.result?.length)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'basic-response')

  return { partId }
}
