// Test referenceGeometry with openFeature on the sketch first
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RefGeoTest2' })).result

  // Create a box
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[02] boxId:', boxId)

  // Get brep edge IDs
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 40] },  // top-front edge
    ]
  })
  const edgeId = geoIds.result.lines[0]
  console.log('[02] edgeId:', edgeId)

  // Create sketch on XY plane
  const skId = (await api.v1.sketch.create({ id: partId, name: 'RefSketch2' })).result
  console.log('[02] sketchId:', skId)

  // Try opening the sketch feature before referenceGeometry
  const openR = await api.v1.part.openFeature({ id: skId })
  console.log('[02] openFeature result:', openR.result, 'maxLevel:', openR.maxLevel)

  const r = await api.v1.sketch.referenceGeometry({
    id: skId,
    brepIds: [edgeId]
  })
  console.log('[02] referenceGeometry result:', r.result)
  console.log('[02] referenceGeometry maxLevel:', r.maxLevel)
  console.log('[02] referenceGeometry messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'refgeo-open')

  // Check sketch geometry
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[02] sketch geometry:', JSON.stringify(geo.result))
  filewrite(geo.result, 'sketch-geometry')

  // Close feature
  await api.v1.part.closeFeature({ id: skId })

  await snapshot('after-refgeo-open')
  return { partId, boxId, skId, edgeId }
}
