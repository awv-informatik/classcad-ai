// 03 — Are translations cumulative? Apply two sequential translations and check position
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CumulativeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference body at origin
  const refId = (await api.v1.solid.cylinder({ id: eifId, height: 20, diameter: 15 })).result

  // Box starting at origin
  const boxId = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30 })).result
  console.log('[03] boxId:', boxId)

  // First translation: +50 on X
  const r1 = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [50, 0, 0] })
  console.log('[03] translate1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('after-first-translate')

  // Second translation: +50 on Y
  const r2 = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [0, 50, 0] })
  console.log('[03] translate2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('after-second-translate')

  // Dump graphic data to verify final position numerically
  const g = (await api.v1.common.recalc({ id: partId }))
  filewrite(g.graphic, 'graphic-after-both')

  return { partId, eifId, boxId }
}
