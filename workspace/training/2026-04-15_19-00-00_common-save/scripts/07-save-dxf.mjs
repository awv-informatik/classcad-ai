// Test save as DXF — docs say "Can only be used to write 2d geometry"
// Try on 3D box first (expect failure or empty), then on 2D sketch
export default async function (api, { snapshot, filewrite }) {
  // First try DXF on 3D geometry
  const partId = (await api.v1.part.create({ name: 'SaveDXF' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const dxf3d = await api.v1.common.save({ format: 'DXF' })
  console.log('[07] DXF on 3D success:', dxf3d.result.success)
  console.log('[07] DXF on 3D length:', dxf3d.result.content?.length)
  console.log('[07] DXF on 3D maxLevel:', dxf3d.maxLevel)
  console.log('[07] DXF on 3D messages:', JSON.stringify(dxf3d.messages))

  // Now try with 2D sketch content
  const partId2 = (await api.v1.part.create({ name: 'DXFSketch' })).result
  const skId = (await api.v1.sketch.create({ id: partId2 })).result
  await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  await api.v1.sketch.circle({ id: skId, centerPos: [40, 25, 0], radius: 15 })

  const dxf2d = await api.v1.common.save({ format: 'DXF' })
  console.log('[07] DXF on 2D success:', dxf2d.result.success)
  console.log('[07] DXF on 2D length:', dxf2d.result.content?.length)
  console.log('[07] DXF on 2D maxLevel:', dxf2d.maxLevel)
  console.log('[07] DXF on 2D first 200:', dxf2d.result.content?.substring(0, 200))

  // DXF with custom version
  const dxf2013 = await api.v1.common.save({ format: 'DXF', dxf: { version: 2013, digits: 8 } })
  console.log('[07] DXF v2013 success:', dxf2013.result.success)
  console.log('[07] DXF v2013 length:', dxf2013.result.content?.length)

  filewrite({
    on3D: { success: dxf3d.result.success, length: dxf3d.result.content?.length, maxLevel: dxf3d.maxLevel, messages: dxf3d.messages },
    on2D: { success: dxf2d.result.success, length: dxf2d.result.content?.length, maxLevel: dxf2d.maxLevel },
    v2013: { success: dxf2013.result.success, length: dxf2013.result.content?.length },
    preview2D: dxf2d.result.content?.substring(0, 500),
  }, 'dxf-comparison')

  return { partId }
}
