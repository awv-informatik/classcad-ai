// 02 — Translation with a reference body to visualize movement
// Also dumps graphic data before/after to verify position numerically
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslationRef' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference body — small cylinder at origin, stays fixed
  const refId = (await api.v1.solid.cylinder({ id: eifId, height: 20, diameter: 15 })).result
  console.log('[02] refId:', refId)

  // Target body — box offset to right
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40, translation: [30, 0, 0] })).result
  console.log('[02] boxId:', boxId)

  // Snapshot before
  const gBefore = (await api.v1.common.recalc({ id: partId }))
  filewrite(gBefore.graphic, 'graphic-before')
  await snapshot('before')

  // Translate box further along X by 60
  const r = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [60, 0, 0] })
  console.log('[02] translation result:', r.result, 'maxLevel:', r.maxLevel)

  // Snapshot after
  const gAfter = (await api.v1.common.recalc({ id: partId }))
  filewrite(gAfter.graphic, 'graphic-after')
  await snapshot('after-translate')

  return { partId, eifId, boxId, refId }
}
