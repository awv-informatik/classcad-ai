// Inspect structure tree details for a region — class, members, parent hierarchy
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructDetail' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })
  const region = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect.result, name: 'DetailRegion' })

  const tree = region.structure?.tree
  const regionNode = tree?.[region.result]

  console.log('[16] region class:', regionNode?.class)
  console.log('[16] region name:', regionNode?.name)
  console.log('[16] region parent:', regionNode?.parent)
  console.log('[16] parent class:', tree?.[regionNode?.parent]?.class)
  console.log('[16] curves member count:', regionNode?.members?.curves?.members?.length)
  console.log('[16] selected member count:', regionNode?.members?.selected?.members?.length)
  console.log('[16] sketch member:', regionNode?.members?.sketch?.value)

  // Extract just the region node for easier inspection
  filewrite(regionNode, 'region-node')

  return { partId, regionId: region.result }
}
