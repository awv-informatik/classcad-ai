export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCaseTest' })).result

  const tests = [
    { key: '', value: 'empty-key', label: 'empty key' },
    { key: 'empty-val', value: '', label: 'empty value' },
    { key: 'special!@#$%', value: 'special-chars', label: 'special chars in key' },
    { key: 'unicode-key-日本語', value: 'unicode-val-こんにちは', label: 'unicode' },
    { key: 'spaces in key', value: 'spaces in value', label: 'spaces' },
    { key: 'json-val', value: '{"nested": true, "count": 42}', label: 'JSON string value' },
    { key: 'newlines', value: 'line1\nline2\nline3', label: 'newlines in value' },
    { key: 'a'.repeat(500), value: 'long-key', label: '500-char key' },
    { key: 'long-val', value: 'x'.repeat(10000), label: '10K-char value' },
  ]

  const results = []
  for (const t of tests) {
    try {
      const setR = await api.v1.common.setUserData({ id: partId, key: t.key, value: t.value })
      const getR = await api.v1.common.getUserData({ id: partId, key: t.key })
      const match = getR.result === t.value
      console.log(`[04] ${t.label}: set maxLevel=${setR.maxLevel}, roundtrip=${match ? '✓' : '❌'}`)
      results.push({ label: t.label, setMaxLevel: setR.maxLevel, getResult: getR.result?.substring(0, 80), match })
    } catch (err) {
      console.log(`[04] ${t.label}: ERROR ${err.message}`)
      results.push({ label: t.label, error: err.message })
    }
  }

  const allKeys = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log(`[04] total keys: ${allKeys.length}`)
  results.push({ totalKeys: allKeys.length })

  filewrite(results, 'edge-cases')
  return { partId }
}
