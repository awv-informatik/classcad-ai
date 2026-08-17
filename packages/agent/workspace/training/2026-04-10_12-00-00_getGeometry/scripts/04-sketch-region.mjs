// Test getGeometry with a sketch region ID instead of sketch ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle (4 lines)
  const rect = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0],
  })).result
  console.log('[04] rectangle IDs:', JSON.stringify(rect))

  // Create a circle outside the rectangle
  const circId = (await api.v1.sketch.circle({
    id: skId, centerPos: [100, 20, 0], radius: 15,
  })).result
  console.log('[04] circle ID:', circId)

  // Create a sketch region from the rectangle
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect })).result
  console.log('[04] region ID:', regionId)

  // Query with sketch ID — should return ALL geometry
  const allGeo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[04] getGeometry(sketch):', JSON.stringify(allGeo.result))

  // Query with region ID — should return only region geometry?
  const regionGeo = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[04] getGeometry(region):', JSON.stringify(regionGeo.result))

  filewrite({
    allGeo: allGeo.result,
    regionGeo: regionGeo.result,
    allGeoCount: {
      points: allGeo.result.points?.length,
      lines: allGeo.result.lines?.length,
      arcs: allGeo.result.arcs?.length,
      circles: allGeo.result.circles?.length,
    },
    regionGeoCount: {
      points: regionGeo.result.points?.length,
      lines: regionGeo.result.lines?.length,
      arcs: regionGeo.result.arcs?.length,
      circles: regionGeo.result.circles?.length,
    },
  }, 'sketch-vs-region')

  await snapshot('region-test')
  return { partId, skId, regionId }
}
