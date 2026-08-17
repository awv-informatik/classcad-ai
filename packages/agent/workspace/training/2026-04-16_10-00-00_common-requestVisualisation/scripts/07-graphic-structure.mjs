// Deep dive into graphic structure — meshes, edges, vertices, properties, surface info
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisStructure' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Create a sphere (curved surfaces give richer mesh data)
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20 })).result
  console.log('[07] sphId:', sphId)

  const r = await api.v1.common.requestVisualisation({ ids: [sphId] })
  const c = r.graphic.containers[0]

  // Explore meshes in detail
  console.log('[07] mesh count:', c.meshes.length)
  const meshSummary = c.meshes.map((m, i) => ({
    index: i,
    id: m.id,
    vertexCount: m.vertices.length / 3,
    normalCount: m.normals.length / 3,
    indexCount: m.indices.length,
    triangleCount: m.indices.length / 3,
    loopCount: m.loops ? m.loops.length : 0,
    propertiesKeys: m.properties ? Object.keys(m.properties) : [],
    surfaceType: m.properties?.surface?.type,
    surfaceKeys: m.properties?.surface ? Object.keys(m.properties.surface) : [],
  }))
  console.log('[07] mesh summary:', JSON.stringify(meshSummary, null, 2))
  filewrite(meshSummary, 'mesh-summary')

  // Explore edges
  console.log('[07] edge count:', c.edges.length)
  if (c.edges.length > 0) {
    const edgeSummary = c.edges.map((e, i) => ({
      index: i,
      id: e.id,
      keys: Object.keys(e),
      vertexCount: e.vertices ? e.vertices.length / 3 : 0,
    }))
    filewrite(edgeSummary, 'edge-summary')
  }

  // Explore top-level graphic properties
  console.log('[07] graphic.properties:', JSON.stringify(r.graphic.properties))
  filewrite(r.graphic.properties, 'graphic-properties')

  // Explore container properties
  filewrite(c.properties, 'container-properties')

  // One mesh in detail (first one) — capture surface info
  if (c.meshes.length > 0) {
    const m0 = c.meshes[0]
    filewrite({
      surface: m0.properties?.surface,
      operationId: m0.properties?.operationId,
      loops: m0.loops,
    }, 'mesh0-detail')
  }

  await snapshot('sphere-vis')
  return { partId }
}
