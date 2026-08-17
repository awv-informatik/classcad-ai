export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ManyKeys' })).result
  console.log('[07] partId:', partId)

  // Set 50 keys
  for (let i = 0; i < 50; i++) {
    await api.v1.common.setUserData({ id: partId, key: `key_${i}`, value: `val_${i}` })
  }
  const keysBefore = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[07] keys set:', keysBefore.length)

  // Clear all at once
  const r = await api.v1.common.clearUserData({ id: partId })
  console.log('[07] clear result:', r.result, 'maxLevel:', r.maxLevel)

  const keysAfter = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[07] keys after clear:', keysAfter.length)

  filewrite({
    keyCountBefore: keysBefore.length,
    clearMaxLevel: r.maxLevel,
    keyCountAfter: keysAfter.length,
  }, 'many-keys-response')

  return { partId }
}
