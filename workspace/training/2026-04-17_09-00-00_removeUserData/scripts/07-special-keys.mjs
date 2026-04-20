export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SpecialKeys' })).result

  // Set keys with special characters
  const specialKeys = [
    { key: 'unicode-🔧', value: 'wrench' },
    { key: 'spaces in key', value: 'spaced' },
    { key: 'key\nwith\nnewlines', value: 'newlined' },
    { key: 'a'.repeat(200), value: 'long-key' },
  ]

  for (const { key, value } of specialKeys) {
    await api.v1.common.setUserData({ id: partId, key, value })
  }

  const keysBefore = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[07] keys before:', keysBefore.length, 'keys set')

  // Remove each special key and verify
  const results = []
  for (const { key } of specialKeys) {
    const r = await api.v1.common.removeUserData({ id: partId, key })
    const label = key.length > 30 ? key.slice(0, 30) + '...' : key.replace(/\n/g, '\\n')
    console.log('[07] remove', label, '— maxLevel:', r.maxLevel)
    results.push({ key: label, maxLevel: r.maxLevel, result: r.result })
  }

  const keysAfter = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[07] keys after all removes:', keysAfter.length)

  filewrite({ keysBefore, keysAfter, results }, 'special-keys')

  return { partId }
}
