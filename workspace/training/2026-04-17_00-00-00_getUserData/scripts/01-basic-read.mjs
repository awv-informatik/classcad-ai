export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Set a value first
  const setR = await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  console.log('[01] setUserData maxLevel:', setR.maxLevel)

  // Read it back
  const r = await api.v1.common.getUserData({ id: partId, key: 'material' })
  console.log('[01] getUserData result:', r.result)
  console.log('[01] getUserData maxLevel:', r.maxLevel)
  console.log('[01] getUserData typeof result:', typeof r.result)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'basic-read-response')

  return { partId }
}
