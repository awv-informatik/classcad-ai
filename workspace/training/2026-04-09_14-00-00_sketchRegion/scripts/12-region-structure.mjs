// Inspect the structure tree to see how a region appears
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructureTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })
  const region = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect.result, name: 'TestRegion' })
  console.log('[12] region id:', region.result)

  // Dump the structure to inspect the region node
  filewrite(region.structure, 'region-structure')

  // Also get the object type/class of the region
  const typeName = await api.v1.common.getObjectTypeName({ id: region.result })
  console.log('[12] region type name:', typeName.result)

  const objName = await api.v1.common.getObjectName({ id: region.result })
  console.log('[12] region object name:', objName.result)

  return { partId, regionId: region.result }
}
