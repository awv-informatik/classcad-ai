// 05 — Negative translation values and multi-axis translation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegativeTranslate' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference at origin
  const refId = (await api.v1.solid.cylinder({ id: eifId, height: 20, diameter: 15 })).result

  // Box starts offset positively
  const boxId = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [60, 60, 60] })).result

  await snapshot('before')

  // Translate with negative values in all axes
  const r = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [-30, -30, -30] })
  console.log('[05] neg translate result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-negative')

  // Also test multi-axis in one call — already done above (all 3 axes at once)
  // Dump for verification
  const g = (await api.v1.common.recalc({ id: partId }))
  filewrite(g.graphic, 'graphic-after-neg')

  return { boxId }
}
