export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Remove a key that was never set
  const r1 = await api.v1.common.removeUserData({ id: partId, key: 'doesNotExist' })
  console.log('[02] remove nonexistent key result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'nonexistent-key-response')

  // Set a key, remove it, then try to remove again
  await api.v1.common.setUserData({ id: partId, key: 'temp', value: 'val' })
  await api.v1.common.removeUserData({ id: partId, key: 'temp' })
  const r2 = await api.v1.common.removeUserData({ id: partId, key: 'temp' })
  console.log('[02] double remove result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'double-remove-response')

  return { partId }
}
