export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeKeyTest' })).result

  // Set various edge-case keys
  await api.v1.common.setUserData({ id: partId, key: '', value: 'empty-key' })
  await api.v1.common.setUserData({ id: partId, key: '日本語', value: 'unicode' })
  await api.v1.common.setUserData({ id: partId, key: 'key with spaces', value: 'spaces' })
  await api.v1.common.setUserData({ id: partId, key: 'key\twith\ttabs', value: 'tabs' })
  await api.v1.common.setUserData({ id: partId, key: 'key\nwith\nnewlines', value: 'newlines' })
  await api.v1.common.setUserData({ id: partId, key: '!@#$%^&*()', value: 'special' })
  await api.v1.common.setUserData({ id: partId, key: 'a'.repeat(200), value: 'long-key' })

  const r = await api.v1.common.getUserDataKeys({ id: partId })
  console.log('[09] key count:', r.result?.length)
  console.log('[09] maxLevel:', r.maxLevel)

  if (r.result) {
    for (const k of r.result) {
      console.log(`[09] key: ${JSON.stringify(k)} (len=${k.length})`)
    }
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'edge-keys')

  return { partId }
}
