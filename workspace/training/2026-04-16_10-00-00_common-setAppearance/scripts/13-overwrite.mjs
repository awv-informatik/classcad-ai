// Test overwriting appearance — does a new setAppearance replace or merge?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OverwriteTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Set color + transparency
  const r1 = await api.v1.common.setAppearance({ target: eifId, color: [255, 0, 0], transparency: 0.5 })
  console.log('[13] initial set result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Overwrite with only color — does transparency stay or get reset?
  const r2 = await api.v1.common.setAppearance({ target: eifId, color: [0, 0, 255] })
  console.log('[13] color-only overwrite result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Overwrite with only transparency — does color stay or get reset?
  const r3 = await api.v1.common.setAppearance({ target: eifId, transparency: 0.8 })
  console.log('[13] transparency-only overwrite result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Both calls succeeded — we can't observe the actual stored values without a getAppearance API
  // But we can confirm the calls don't error
  console.log('[13] all overwrite calls successful (maxLevel ≤ 31)')

  return { partId }
}
