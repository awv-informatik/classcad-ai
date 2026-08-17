// Explore what requestVisualisation returns for shapes/curves in detail
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisCurves' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Create a shape with a circle curve
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'CircleShape' })).result
  await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20 })
  console.log('[06] shapeId:', shapeId)

  // Request vis for shape
  const r = await api.v1.common.requestVisualisation({ ids: [shapeId] })
  console.log('[06] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] graphic?', !!r.graphic)

  if (r.graphic) {
    console.log('[06] container count:', r.graphic.containers.length)
    const c = r.graphic.containers[0]
    console.log('[06] container keys:', Object.keys(c))
    console.log('[06] container type:', c.type)
    console.log('[06] container id:', c.id, 'owner:', c.owner)
    console.log('[06] has meshes?', !!(c.meshes && c.meshes.length), 'count:', c.meshes?.length)
    console.log('[06] has edges?', !!(c.edges && c.edges.length), 'count:', c.edges?.length)
    console.log('[06] has vertices?', !!(c.vertices && c.vertices.length), 'count:', c.vertices?.length)
    console.log('[06] properties:', JSON.stringify(c.properties))

    // For curves, detail the edge data
    if (c.edges && c.edges.length > 0) {
      const edgeSummary = c.edges.map((e, i) => ({
        index: i,
        keys: Object.keys(e),
        vertexCount: e.vertices ? e.vertices.length / 3 : 0,
      }))
      console.log('[06] edge summary:', JSON.stringify(edgeSummary))
    }
    filewrite(r.graphic, 'curve-graphic')
  }

  await snapshot('curve-vis')
  return { partId }
}
