export default async function (api, { filewrite }) {
  // Reproduce the script-02 null result: second part with numeric keys
  const partId1 = (await api.v1.part.create({ name: 'Part1' })).result
  const partId2 = (await api.v1.part.create({ name: 'Part2' })).result
  console.log('[06] partId1:', partId1, 'partId2:', partId2)

  // Set keys on part1
  await api.v1.common.setUserData({ id: partId1, key: 'a', value: '1' })
  await api.v1.common.setUserData({ id: partId1, key: 'b', value: '2' })

  // Set keys on part2 (same as script 02)
  for (let i = 10; i >= 1; i--) {
    const r = await api.v1.common.setUserData({ id: partId2, key: `key${i}`, value: `${i}` })
    if (r.maxLevel > 31) {
      console.log(`[06] setUserData key${i} on part2 FAILED:`, r.maxLevel, JSON.stringify(r.messages))
    }
  }

  // Query keys on both parts
  const r1 = await api.v1.common.getUserDataKeys({ id: partId1 })
  const r2 = await api.v1.common.getUserDataKeys({ id: partId2 })
  console.log('[06] part1 keys:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  console.log('[06] part2 keys:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  console.log('[06] part2 null?', r2.result === null)

  filewrite({ part1: { id: partId1, keys: r1.result, maxLevel: r1.maxLevel }, part2: { id: partId2, keys: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'two-parts')

  return { partId1, partId2 }
}
