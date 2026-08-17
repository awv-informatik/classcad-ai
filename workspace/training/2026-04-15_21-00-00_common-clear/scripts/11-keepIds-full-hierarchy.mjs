// 11 — keepIds: keep full hierarchy (part + eif + solid)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FullKeep' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 20, translation: [80, 0, 0] })).result
  console.log('[11] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'cylId:', cylId)

  await snapshot('before')

  // Keep part + eif + box (but NOT cyl)
  const r = await api.v1.common.clear({ keepIds: [partId, eifId, boxId] })
  console.log('[11] keepIds=[partId, eifId, boxId] — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'keep-full')

  // Can we copy the kept box?
  const copyR = await api.v1.solid.copy({ id: eifId, target: boxId, translation: [0, 60, 0] })
  console.log('[11] copy kept box — result:', copyR.result, 'maxLevel:', copyR.maxLevel)

  // Can we copy the NOT-kept cylinder?
  const copyCyl = await api.v1.solid.copy({ id: eifId, target: cylId, translation: [0, -60, 0] })
  console.log('[11] copy dropped cyl — result:', copyCyl.result, 'maxLevel:', copyCyl.maxLevel)

  // Do a snapshot (this triggers recalc) — safe now because we kept the hierarchy?
  await snapshot('after-keep-full')

  return { partId }
}
