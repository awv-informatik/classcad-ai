export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LargeKeyTest' })).result

  // Test increasing key counts to find where null kicks in
  const results = []
  for (let i = 1; i <= 20; i++) {
    await api.v1.common.setUserData({ id: partId, key: `key${String(i).padStart(2, '0')}`, value: `val${i}` })
    const r = await api.v1.common.getUserDataKeys({ id: partId })
    const keyCount = i
    const returned = r.result
    const isNull = returned === null
    const isArray = Array.isArray(returned)
    const len = returned?.length ?? 'N/A'
    console.log(`[05] ${keyCount} keys set → result: ${isNull ? 'null' : `array(${len})`}, maxLevel: ${r.maxLevel}`)
    results.push({ keysSet: keyCount, isNull, isArray, length: len, maxLevel: r.maxLevel })
    if (isNull) break
  }

  filewrite(results, 'large-key-results')

  return { partId }
}
