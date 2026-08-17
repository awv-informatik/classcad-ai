// Test: Does updateSketchRegion preserve the region's name?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'MyProfile' })).result

  // Lookup by name before update
  const beforeLookup = await api.v1.sketch.getSketchRegion({ id: skId, name: 'MyProfile' })
  console.log('[14] before lookup:', beforeLookup.result, '=== regionId:', regionId)

  // Update geometry
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, -20, 0], endPos: [30, -20, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [30, -20, 0], endPos: [15, -5, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [15, -5, 0], endPos: [0, -20, 0] })).result
  await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: [l1, l2, l3] }] })

  // Lookup by name after update — should still find it
  const afterLookup = await api.v1.sketch.getSketchRegion({ id: skId, name: 'MyProfile' })
  console.log('[14] after lookup:', afterLookup.result, '=== regionId:', regionId)
  console.log('[14] name preserved:', beforeLookup.result === afterLookup.result)

  filewrite({
    regionId,
    beforeLookup: beforeLookup.result,
    afterLookup: afterLookup.result,
    namePreserved: beforeLookup.result === afterLookup.result,
  }, 'name-preserved')

  return { partId }
}
