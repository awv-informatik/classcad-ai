export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 30, height: 50 })).result
  await api.v1.common.recalc({})

  // Get circular edges and cylindrical face
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [
      { pos: [0, 0, 0] },   // bottom circle (center)
      { pos: [0, 0, 50] },  // top circle (center)
    ],
    lines: [
      { pos: [30, 0, 25] }, // seam line (if exists)
    ],
    cylinders: [
      { positions: [[30, 0, 25], [0, 30, 25]] }, // cylindrical face
    ],
    planes: [
      { positions: [[0, 0, 0]] },  // bottom face
      { positions: [[0, 0, 50]] }, // top face
    ],
  })

  console.log('[05] circles:', JSON.stringify(geoR.result.circles))
  console.log('[05] lines:', JSON.stringify(geoR.result.lines))
  console.log('[05] cylinders:', JSON.stringify(geoR.result.cylinders))
  console.log('[05] planes:', JSON.stringify(geoR.result.planes))
  console.log('[05] maxLevel:', geoR.maxLevel)

  const results = []

  // Index circles (arcs in brep)
  if (geoR.result.circles) {
    for (let i = 0; i < geoR.result.circles.length; i++) {
      const cId = geoR.result.circles[i]
      if (!cId) { console.log('[05] circle', i, 'not found'); continue }
      const r = await api.v1.part.getBrepGeometryIndex({ id: cylId, geomId: cId })
      console.log('[05] circle', i, 'id:', cId, '→ index:', r.result, 'maxLevel:', r.maxLevel)
      results.push({ type: 'circle', i, id: cId, index: r.result, maxLevel: r.maxLevel })
    }
  }

  // Index lines (seam)
  if (geoR.result.lines) {
    for (let i = 0; i < geoR.result.lines.length; i++) {
      const lId = geoR.result.lines[i]
      if (!lId) { console.log('[05] line', i, 'not found'); continue }
      const r = await api.v1.part.getBrepGeometryIndex({ id: cylId, geomId: lId })
      console.log('[05] line', i, 'id:', lId, '→ index:', r.result, 'maxLevel:', r.maxLevel)
      results.push({ type: 'line', i, id: lId, index: r.result, maxLevel: r.maxLevel })
    }
  }

  // Index cylindrical face
  if (geoR.result.cylinders) {
    for (let i = 0; i < geoR.result.cylinders.length; i++) {
      const cfId = geoR.result.cylinders[i]
      if (!cfId) { console.log('[05] cylinder face', i, 'not found'); continue }
      const r = await api.v1.part.getBrepGeometryIndex({ id: cylId, geomId: cfId })
      console.log('[05] cyl face', i, 'id:', cfId, '→ index:', r.result, 'maxLevel:', r.maxLevel)
      results.push({ type: 'cylinder-face', i, id: cfId, index: r.result, maxLevel: r.maxLevel })
    }
  }

  // Index plane faces (top/bottom)
  if (geoR.result.planes) {
    for (let i = 0; i < geoR.result.planes.length; i++) {
      const pfId = geoR.result.planes[i]
      if (!pfId) { console.log('[05] plane face', i, 'not found'); continue }
      const r = await api.v1.part.getBrepGeometryIndex({ id: cylId, geomId: pfId })
      console.log('[05] plane face', i, 'id:', pfId, '→ index:', r.result, 'maxLevel:', r.maxLevel)
      results.push({ type: 'plane-face', i, id: pfId, index: r.result, maxLevel: r.maxLevel })
    }
  }

  filewrite(results, 'cylinder-indices')
  await snapshot('cylinder')
  return { partId, cylId }
}
