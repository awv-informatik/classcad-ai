export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ClearEmpty' })).result
  console.log('[02] partId:', partId)

  // Clear on object with NO user data
  const r1 = await api.v1.common.clearUserData({ id: partId })
  console.log('[02] clear empty — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[02] clear empty — messages:', JSON.stringify(r1.messages))

  // Double clear — clear again after already cleared
  await api.v1.common.setUserData({ id: partId, key: 'test', value: 'val' })
  await api.v1.common.clearUserData({ id: partId })
  const r2 = await api.v1.common.clearUserData({ id: partId })
  console.log('[02] double clear — result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    clearEmpty: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    doubleClear: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'clear-empty-response')

  return { partId }
}
