export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LengthTest' })).result

  // Test progressively longer values
  const lengths = [100, 1000, 5000, 10000, 50000, 100000]
  const results = {}

  for (const len of lengths) {
    const val = 'x'.repeat(len)
    const r = await api.v1.common.setUserData({ id: partId, key: `len_${len}`, value: val })
    const g = await api.v1.common.getUserData({ id: partId, key: `len_${len}` })
    const retrieved = g.result
    const match = retrieved === val
    results[`len_${len}`] = {
      setMaxLevel: r.maxLevel,
      retrievedLength: retrieved ? retrieved.length : null,
      match,
    }
    console.log(`[06] len=${len}: set maxLevel=${r.maxLevel}, retrieved ${retrieved ? retrieved.length : 'null'} chars, match=${match}`)
    if (!match && r.maxLevel <= 31) {
      console.log(`[06] MISMATCH at len=${len}: sent ${len} chars, got ${retrieved ? retrieved.length : 'null'}`)
    }
  }

  // Test long key
  const longKey = 'k'.repeat(1000)
  const rk = await api.v1.common.setUserData({ id: partId, key: longKey, value: 'longkey' })
  const gk = await api.v1.common.getUserData({ id: partId, key: longKey })
  console.log(`[06] long key (1000 chars): set maxLevel=${rk.maxLevel}, get=${JSON.stringify(gk.result)}`)
  results.longKey = { setMaxLevel: rk.maxLevel, getValue: gk.result }

  // Test JSON-encoded value (workaround for string-only limitation)
  const jsonVal = JSON.stringify({ name: 'test', count: 42, nested: { a: 1 } })
  const rj = await api.v1.common.setUserData({ id: partId, key: 'jsonData', value: jsonVal })
  const gj = await api.v1.common.getUserData({ id: partId, key: 'jsonData' })
  const parsed = JSON.parse(gj.result)
  console.log('[06] JSON roundtrip: set maxLevel=', rj.maxLevel, 'parsed:', parsed)
  results.jsonRoundtrip = { setMaxLevel: rj.maxLevel, retrievedParsed: parsed, match: gj.result === jsonVal }

  filewrite(results, 'length-results')

  return { partId }
}
