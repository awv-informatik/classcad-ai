// 04 — Do settings change after creating geometry?
export default async function (api, { filewrite }) {
  const before = (await api.v1.common.getDatabaseSettings()).result

  // Create a part with a box
  const partId = (await api.v1.part.create({ name: 'SettingsTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

  const afterGeo = (await api.v1.common.getDatabaseSettings()).result

  console.log('[04] Before geometry:', JSON.stringify(before))
  console.log('[04] After geometry:', JSON.stringify(afterGeo))
  console.log('[04] Settings changed:', JSON.stringify(before) !== JSON.stringify(afterGeo))

  filewrite({ before, afterGeo }, 'with-geometry')

  return { before, afterGeo }
}
