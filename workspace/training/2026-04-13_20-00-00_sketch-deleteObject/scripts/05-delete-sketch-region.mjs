// Test: deleting a sketch region — does it remove just the region, or the geometry too?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DelRegion' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a closed rectangle
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
  console.log('[05] rect IDs:', JSON.stringify(rect))

  // Create a region from the rectangle lines
  const region = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect })).result
  console.log('[05] region ID:', region)

  await snapshot('before-delete-region')

  // Get geometry before
  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geomBefore.result, 'geom-before')

  // Delete the sketch region only
  const r1 = await api.v1.sketch.deleteObject({ ids: [region] })
  console.log('[05] delete region result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'delete-region-response')

  await snapshot('after-delete-region')

  // Check if the rectangle lines are still there
  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[05] lines after region delete:', geomAfter.result?.lines?.length)
  filewrite(geomAfter.result, 'geom-after-region-delete')

  return { partId }
}
