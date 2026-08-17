export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Set many keys, read them all back
  const keyCount = 20
  for (let i = 0; i < keyCount; i++) {
    await api.v1.common.setUserData({ id: partId, key: `key_${i}`, value: `val_${i}` })
  }

  // Read them all
  const reads = {}
  for (let i = 0; i < keyCount; i++) {
    const r = await api.v1.common.getUserData({ id: partId, key: `key_${i}` })
    reads[`key_${i}`] = r.result
  }
  console.log('[08] all 20 keys read successfully:', Object.values(reads).every((v, i) => v === `val_${i}`))

  // Also list all keys
  const keysR = await api.v1.common.getUserDataKeys({ id: partId })
  console.log('[08] getUserDataKeys count:', keysR.result.length)
  console.log('[08] getUserDataKeys:', keysR.result.sort().join(', '))

  filewrite({ reads, keys: keysR.result }, 'multiple-keys')

  return { partId }
}
