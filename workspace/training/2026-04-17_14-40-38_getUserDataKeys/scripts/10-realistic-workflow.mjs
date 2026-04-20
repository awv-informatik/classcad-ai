export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Workflow' })).result

  // Simulate a metadata management workflow:
  // 1. Set several metadata entries
  await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  await api.v1.common.setUserData({ id: partId, key: 'color', value: 'blue' })
  await api.v1.common.setUserData({ id: partId, key: 'weight', value: '42.5' })
  await api.v1.common.setUserData({ id: partId, key: 'revision', value: 'A' })
  await api.v1.common.setUserData({ id: partId, key: 'author', value: 'cc' })

  // 2. Use getUserDataKeys to enumerate all metadata
  const allKeys = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[10] all keys:', JSON.stringify(allKeys))

  // 3. Read all values by iterating keys
  const metadata = {}
  for (const key of allKeys) {
    metadata[key] = (await api.v1.common.getUserData({ id: partId, key })).result
  }
  console.log('[10] all metadata:', JSON.stringify(metadata))

  // 4. Check if a specific key exists (pattern: use getUserDataKeys)
  const hasWeight = allKeys.includes('weight')
  const hasTemp = allKeys.includes('temperature')
  console.log('[10] has weight?', hasWeight, 'has temperature?', hasTemp)

  // 5. Remove some keys, check keys again
  await api.v1.common.removeUserData({ id: partId, key: 'color' })
  await api.v1.common.removeUserData({ id: partId, key: 'weight' })
  const afterRemove = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[10] after removing 2 keys:', JSON.stringify(afterRemove))

  // 6. Get count of remaining keys
  console.log('[10] remaining count:', afterRemove.length)

  filewrite({ allKeys, metadata, afterRemove }, 'workflow')

  return { partId }
}
