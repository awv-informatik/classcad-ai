// Test OFB geometry option (0-4) — different levels of stored data
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OFBGeo' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Geometry level 0: only ClassCAD objects
  const g0 = await api.v1.common.save({ format: 'OFB', ofb: { geometry: 0 }, encoding: 'base64' })
  console.log('[09] ofb.geometry=0 (objects only):', g0.result.success, 'length:', g0.result.content?.length)

  // Geometry level 1: objects for class format
  const g1 = await api.v1.common.save({ format: 'OFB', ofb: { geometry: 1 }, encoding: 'base64' })
  console.log('[09] ofb.geometry=1 (class format):', g1.result.success, 'length:', g1.result.content?.length)

  // Geometry level 2: objects + geometry (DEFAULT)
  const g2 = await api.v1.common.save({ format: 'OFB', ofb: { geometry: 2 }, encoding: 'base64' })
  console.log('[09] ofb.geometry=2 (objects+geo):', g2.result.success, 'length:', g2.result.content?.length)

  // Geometry level 3: objects + graphics
  const g3 = await api.v1.common.save({ format: 'OFB', ofb: { geometry: 3 }, encoding: 'base64' })
  console.log('[09] ofb.geometry=3 (objects+gfx):', g3.result.success, 'length:', g3.result.content?.length)

  // Geometry level 4: objects + geometry + graphics
  const g4 = await api.v1.common.save({ format: 'OFB', ofb: { geometry: 4 }, encoding: 'base64' })
  console.log('[09] ofb.geometry=4 (all):', g4.result.success, 'length:', g4.result.content?.length)

  filewrite({
    level0: { success: g0.result.success, length: g0.result.content?.length },
    level1: { success: g1.result.success, length: g1.result.content?.length },
    level2: { success: g2.result.success, length: g2.result.content?.length },
    level3: { success: g3.result.success, length: g3.result.content?.length },
    level4: { success: g4.result.success, length: g4.result.content?.length },
  }, 'ofb-geo-levels')

  return { partId }
}
