// 11 — What does isCCGraphicEnabled control?
// "classcad graphic" — possibly internal/system graphic vs user graphic?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CCGfxTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create geometry with isCCGraphicEnabled ON (default)
  const boxR1 = await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })
  const gfxSize1 = boxR1.graphic ? JSON.stringify(boxR1.graphic).length : 0
  console.log('[11] With CC gfx ON: graphic size:', gfxSize1)

  // Disable CC graphic
  await api.v1.common.setDatabaseSettings({ isCCGraphicEnabled: false })
  const db = (await api.v1.common.getDatabaseSettings()).result
  console.log('[11] After disable: isCCGraphicEnabled:', db.isCCGraphicEnabled)

  // Create another box
  const boxR2 = await api.v1.solid.box({ id: eifId, length: 30, width: 20, height: 10, translation: [60, 0, 0] })
  const gfxSize2 = boxR2.graphic ? JSON.stringify(boxR2.graphic).length : 0
  console.log('[11] With CC gfx OFF: graphic size:', gfxSize2)

  // Restore
  await api.v1.common.setDatabaseSettings({ isCCGraphicEnabled: true })

  filewrite({ withCCGfx: gfxSize1, withoutCCGfx: gfxSize2 }, 'cc-graphic')

  return { gfxSize1, gfxSize2 }
}
