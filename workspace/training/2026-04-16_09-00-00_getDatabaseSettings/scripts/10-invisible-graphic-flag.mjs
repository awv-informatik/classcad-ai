// 10 — What does isInvisibleGraphicEnabled do? Default is 0 (off).
// Theory: when enabled, invisible/hidden objects also generate tessellation data
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvGfxTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a box
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

  // Get graphic with default settings (invisible gfx OFF)
  const r1 = await api.v1.common.getDatabaseSettings()
  console.log('[10] isInvisibleGraphicEnabled:', r1.result.isInvisibleGraphicEnabled)

  // Enable invisible graphic
  await api.v1.common.setDatabaseSettings({ isInvisibleGraphicEnabled: true })
  const r2 = await api.v1.common.getDatabaseSettings()
  console.log('[10] After enable: isInvisibleGraphicEnabled:', r2.result.isInvisibleGraphicEnabled)

  // Restore
  await api.v1.common.setDatabaseSettings({ isInvisibleGraphicEnabled: false })

  filewrite({ before: r1.result, after: r2.result }, 'invisible-graphic')

  return { before: r1.result, after: r2.result }
}
