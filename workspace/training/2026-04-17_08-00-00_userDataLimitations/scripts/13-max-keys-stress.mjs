export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StressTest' })).result

  // Set many keys — how many can an object hold?
  const counts = [50, 100, 200, 500]
  const results = {}

  let totalSet = 0
  for (const target of counts) {
    // Set keys up to target
    for (let i = totalSet; i < target; i++) {
      const r = await api.v1.common.setUserData({ id: partId, key: `k${i}`, value: `v${i}` })
      if (r.maxLevel > 31) {
        console.log(`[13] failed at key #${i}: maxLevel=${r.maxLevel}`)
        results[`failAt_${i}`] = { maxLevel: r.maxLevel, messages: r.messages }
        break
      }
    }
    totalSet = target

    const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
    console.log(`[13] after setting ${target} keys: actual count=${keys ? keys.length : 'null'}`)
    results[`at_${target}`] = keys ? keys.length : null
  }

  filewrite(results, 'stress-results')

  return { partId }
}
