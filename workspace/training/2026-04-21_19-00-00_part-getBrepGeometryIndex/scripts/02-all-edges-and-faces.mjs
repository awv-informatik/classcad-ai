export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get ALL edges of the box — 12 edges total
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      // Bottom 4 edges
      { pos: [40, 0, 0] },   // front bottom
      { pos: [80, 30, 0] },  // right bottom
      { pos: [40, 60, 0] },  // back bottom
      { pos: [0, 30, 0] },   // left bottom
      // Top 4 edges
      { pos: [40, 0, 40] },  // front top
      { pos: [80, 30, 40] }, // right top
      { pos: [40, 60, 40] }, // back top
      { pos: [0, 30, 40] },  // left top
      // Vertical 4 edges
      { pos: [0, 0, 20] },   // front-left vertical
      { pos: [80, 0, 20] },  // front-right vertical
      { pos: [80, 60, 20] }, // back-right vertical
      { pos: [0, 60, 20] },  // back-left vertical
    ],
    planes: [
      { positions: [[40, 0, 20]] },  // front face
      { positions: [[80, 30, 20]] }, // right face
      { positions: [[40, 60, 20]] }, // back face
      { positions: [[0, 30, 20]] },  // left face
      { positions: [[40, 30, 0]] },  // bottom face
      { positions: [[40, 30, 40]] }, // top face
    ],
    points: [
      { pos: [0, 0, 0] },     // vertex 0
      { pos: [80, 0, 0] },    // vertex 1
      { pos: [80, 60, 0] },   // vertex 2
      { pos: [0, 60, 0] },    // vertex 3
      { pos: [0, 0, 40] },    // vertex 4
      { pos: [80, 0, 40] },   // vertex 5
      { pos: [80, 60, 40] },  // vertex 6
      { pos: [0, 60, 40] },   // vertex 7
    ],
  })

  console.log('[02] lines:', JSON.stringify(geoR.result.lines))
  console.log('[02] planes:', JSON.stringify(geoR.result.planes))
  console.log('[02] points:', JSON.stringify(geoR.result.points))

  // Index all edges
  const edgeIndices = []
  for (let i = 0; i < geoR.result.lines.length; i++) {
    const edgeId = geoR.result.lines[i]
    const r = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId })
    edgeIndices.push({ i, edgeId, index: r.result })
  }
  console.log('[02] edge indices:', JSON.stringify(edgeIndices.map(e => e.index)))

  // Index all faces
  const faceIndices = []
  for (let i = 0; i < geoR.result.planes.length; i++) {
    const faceId = geoR.result.planes[i]
    const r = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: faceId })
    faceIndices.push({ i, faceId, index: r.result })
  }
  console.log('[02] face indices:', JSON.stringify(faceIndices.map(f => f.index)))

  // Index all vertices
  const vertIndices = []
  for (let i = 0; i < geoR.result.points.length; i++) {
    const ptId = geoR.result.points[i]
    const r = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: ptId })
    vertIndices.push({ i, ptId, index: r.result })
  }
  console.log('[02] vertex indices:', JSON.stringify(vertIndices.map(v => v.index)))

  filewrite({ edgeIndices, faceIndices, vertIndices }, 'all-indices')
  return { partId, boxId }
}
