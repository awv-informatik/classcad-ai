// Get detailed mesh data from a sphere to understand its tessellation
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereMesh' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const r = await api.v1.solid.sphere({ id: eifId, radius: 40 })
  console.log('[12] sphere:', r.result, 'maxLevel:', r.maxLevel)

  if (r.graphic?.containers?.length > 0) {
    const c = r.graphic.containers[0]
    console.log('[12] container keys:', Object.keys(c).join(', '))
    console.log('[12] container.id:', c.id, 'type:', c.type)

    // Mesh data
    if (c.meshes?.length > 0) {
      const meshSummary = c.meshes.map((m, i) => ({
        index: i,
        keys: Object.keys(m),
        verticesLength: m.vertices?.length,
        normalsLength: m.normals?.length,
        indicesLength: m.indices?.length,
        triangleCount: m.indices ? m.indices.length / 3 : 0,
        vertexCount: m.vertices ? m.vertices.length / 3 : 0,
      }))
      console.log('[12] mesh count:', c.meshes.length)
      console.log('[12] first mesh verts:', meshSummary[0]?.vertexCount, 'tris:', meshSummary[0]?.triangleCount)
      filewrite(meshSummary, 'mesh-summary')
    }

    // Edge data
    if (c.edges?.length > 0) {
      console.log('[12] edge count:', c.edges.length)
      filewrite({ edgeCount: c.edges.length, firstEdgeKeys: Object.keys(c.edges[0]) }, 'edge-summary')
    }

    // Vertex data (topological vertices, not mesh verts)
    if (c.vertices?.length > 0) {
      console.log('[12] topo vertex count:', c.vertices.length)
    }
  }

  return { partId, eifId }
}
