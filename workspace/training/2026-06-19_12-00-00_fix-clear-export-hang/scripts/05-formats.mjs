// After clear({keepIds}), test each export format for hang vs clean return.
export default async function (api) {
  const wt = (p, ms, l) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error(`HUNG ${ms}ms`)), ms))])
  const test = async (label, params) => {
    const part = (await api.v1.part.create({})).result
    const eif = (await api.v1.part.entityInjection({ id: part })).result
    await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })
    await api.v1.common.clear({ keepIds: [part] })
    try { const r = await wt(api.v1.common.save(params), 10000, label); console.log(`${label}: maxLevel ${r.maxLevel} -> returned`) }
    catch (e) { console.log(`${label}: ${e.message}`) }
  }
  await test('STP-assembly', { format: 'STP', encoding: 'base64', stp: { version: 2 } })
  await test('STP-asPart  ', { format: 'STP', encoding: 'base64', stp: { asPart: true, version: 2 } })
  await test('OFB         ', { format: 'OFB', encoding: 'base64' })
  await test('STL         ', { format: 'STL', encoding: 'base64' })
}
