export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const cases = [
    { label: 'empty-key', key: '', value: 'empty' },
    { label: 'spaces', key: '  spaces  ', value: 'padded' },
    { label: 'unicode', key: '日本語キー', value: 'unicode-val' },
    { label: 'emoji', key: '🔧', value: 'wrench' },
    { label: 'special-chars', key: 'k!@#$%^&*()', value: 'special' },
    { label: 'long-key', key: 'x'.repeat(500), value: 'long' },
    { label: 'newline-key', key: 'line1\nline2', value: 'newlined' },
  ]

  const results = {}
  for (const { label, key, value } of cases) {
    const setR = await api.v1.common.setUserData({ id: partId, key, value })
    const getR = await api.v1.common.getUserData({ id: partId, key })
    console.log(`[05] ${label}: set maxLevel=${setR.maxLevel}, get result=${JSON.stringify(getR.result)}, get maxLevel=${getR.maxLevel}`)
    results[label] = {
      setMaxLevel: setR.maxLevel,
      getResult: getR.result,
      getMaxLevel: getR.maxLevel,
      matches: getR.result === value,
    }
  }

  filewrite(results, 'edge-case-keys')

  return { partId }
}
