// 18 — keepIds + recalc: does recalc hang after clear with keepIds?
// WARNING: may hang server. No snapshot, just recalc.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[18] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Keep just the part
  await api.v1.common.clear({ keepIds: [partId] })
  console.log('[18] cleared with keepIds=[partId]')

  // Try recalc — the suspected culprit
  const recR = await api.v1.common.recalc({})
  console.log('[18] recalc — result:', recR.result, 'maxLevel:', recR.maxLevel)
  console.log('[18] recalc messages:', JSON.stringify(recR.messages))

  return {}
}
