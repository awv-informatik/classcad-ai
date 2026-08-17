export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Test large value strings
  const sizes = [100, 1000, 10000, 50000]
  const results = {}

  for (const size of sizes) {
    const value = 'A'.repeat(size)
    const setR = await api.v1.common.setUserData({ id: partId, key: `big_${size}`, value })
    const getR = await api.v1.common.getUserData({ id: partId, key: `big_${size}` })
    const match = getR.result === value
    console.log(`[09] size=${size}: set maxLevel=${setR.maxLevel}, get length=${getR.result?.length}, match=${match}`)
    results[`size_${size}`] = {
      setMaxLevel: setR.maxLevel,
      getLength: getR.result?.length,
      match,
      getMaxLevel: getR.maxLevel,
    }
  }

  // Also test JSON-serialized object as value
  const obj = { nested: { array: [1, 2, 3], bool: true }, name: 'test' }
  await api.v1.common.setUserData({ id: partId, key: 'json', value: JSON.stringify(obj) })
  const jsonR = await api.v1.common.getUserData({ id: partId, key: 'json' })
  const parsed = JSON.parse(jsonR.result)
  console.log('[09] JSON roundtrip match:', JSON.stringify(parsed) === JSON.stringify(obj))
  results.jsonRoundtrip = { stored: jsonR.result, parsedMatch: JSON.stringify(parsed) === JSON.stringify(obj) }

  filewrite(results, 'large-values')

  return { partId }
}
