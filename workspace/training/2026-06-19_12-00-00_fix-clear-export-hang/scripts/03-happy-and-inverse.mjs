// Confirms the export guard does not break valid exports.
export default async function (api) {
  const wt = (p, ms, l) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error(`HUNG ${ms}ms ${l}`)), ms))])
  const len = r => (r.result?.data || r.result || '').length || (typeof r.result === 'string' ? r.result.length : 0)

  // HAPPY: plain box, export STP (no clear) -> must succeed with real output
  let part = (await api.v1.part.create({ name: 'Happy' })).result
  let eif = (await api.v1.part.entityInjection({ id: part })).result
  await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })
  let r = await wt(api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version: 2 } }), 12000, 'happy save')
  console.log(`HAPPY: maxLevel ${r.maxLevel} success ${r.result?.success} outLen ${len(r)}`)

  // INVERSE: clear keepIds, then add NEW geometry in the kept part, then export -> must succeed
  let part2 = (await api.v1.part.create({ name: 'Inv' })).result
  let eif2 = (await api.v1.part.entityInjection({ id: part2 })).result
  await api.v1.solid.box({ id: eif2, length: 50, width: 50, height: 50 })
  await api.v1.common.clear({ keepIds: [part2] })
  // recreate eif + geometry in the kept part
  let eif2b = (await api.v1.part.entityInjection({ id: part2 })).result
  let nb = await api.v1.solid.box({ id: eif2b, length: 20, width: 20, height: 20 })
  console.log(`INVERSE newBox maxLevel ${nb.maxLevel} result ${nb.result}`)
  r = await wt(api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version: 2 } }), 12000, 'inverse save')
  console.log(`INVERSE: maxLevel ${r.maxLevel} success ${r.result?.success} outLen ${len(r)}`)
}
