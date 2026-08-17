// Does deleting the (consumed/ghost) tools after a partially-failed multi-tool
// subtraction clear the bad state so STEP export no longer hangs?
//   CC_TEST=none   -> failed sub, then save (baseline: should hang)
//   CC_TEST=delall -> failed sub, deleteSolid all tool ids, then save
export default async function (api, { filewrite }) {
  const which = process.env.CC_TEST || 'delall'
  const withTimeout = (p, ms, l) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error(`HUNG ${ms}ms ${l}`)), ms))])

  const part = (await api.v1.part.create({ name: 'CleanupTest' })).result
  const eif = (await api.v1.part.entityInjection({ id: part })).result
  const box = (await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })).result
  const c1 = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const c2 = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const c3 = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [30, 30, -5] })).result
  const sub = await api.v1.solid.subtraction({ id: eif, target: box, tools: [c1, c2, c3] })
  console.log('sub maxLevel', sub.maxLevel)

  if (which === 'delall') {
    const d = await api.v1.solid.deleteSolid({ id: eif, ids: [c1, c2, c3] })
    console.log('deleteSolid maxLevel', d.maxLevel, 'messages', JSON.stringify(d.messages)?.slice(0, 100))
  }

  try {
    const r = await withTimeout(api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version: 2 } }), 10000, 'save')
    console.log(`save: maxLevel ${r.maxLevel} ok ${r.result?.success}`)
  } catch (e) { console.error(e.message) }
  filewrite({ which, subMaxLevel: sub.maxLevel }, `cleanup-${which}`)
}
