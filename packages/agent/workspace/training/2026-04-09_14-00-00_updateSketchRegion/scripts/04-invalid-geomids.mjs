// Test: Update with invalid geometry IDs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  console.log('[04] regionId:', regionId)

  // Try updating with part ID as geomId
  const r1 = await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: [partId] }] })
  console.log('[04] partId as geomId — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] messages:', JSON.stringify(r1.messages))
  filewrite({ partIdAsGeom: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages } }, 'wrong-type-geom')

  // Try updating with fake numeric IDs
  const r2 = await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: [99999] }] })
  console.log('[04] fakeGeomId — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[04] messages:', JSON.stringify(r2.messages))
  filewrite({ fakeGeomId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'fake-geom')

  // Verify region still has original geometry after errors
  const geom = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[04] geom after errors:', JSON.stringify(geom.result))
  filewrite({ geomAfterErrors: geom.result }, 'geom-after-errors')

  return { partId, regionId }
}
