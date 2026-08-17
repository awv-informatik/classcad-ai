export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Find an edge for filleting
  const geoR = await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [0, 0, 20] }] })
  const edgeId = geoR.result.lines[0]
  console.log(`[10] edge to fillet: ${edgeId}`)

  const filletId = (await api.v1.part.fillet({ id: partId, name: 'Fillet1', references: [edgeId], radius: 10 })).result
  console.log(`[10] filletId: ${filletId}`)
  await api.v1.common.recalc({})

  // Enumerate arcs on the fillet feature
  const arcs = []
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, arcIndex: i })
    if (r.result === null) break
    arcs.push({ index: i, id: r.result })
    console.log(`[10] fillet arcIndex=${i}: id=${r.result}`)
  }

  // Enumerate faces on the fillet feature
  const faces = []
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, faceIndex: i })
    if (r.result === null) break
    faces.push({ index: i, id: r.result })
    console.log(`[10] fillet faceIndex=${i}: id=${r.result}`)
  }

  // Enumerate lines on the fillet feature
  const lines = []
  for (let i = 0; i < 20; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, lineIndex: i })
    if (r.result === null) break
    lines.push({ index: i, id: r.result })
  }
  console.log(`[10] fillet lines: ${lines.length}`)

  // Enumerate points on the fillet feature
  const points = []
  for (let i = 0; i < 20; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, pointIndex: i })
    if (r.result === null) break
    points.push({ index: i, id: r.result })
  }
  console.log(`[10] fillet points: ${points.length}`)

  // Check NURBS on fillet
  const nurbs = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, nurbsCurveIndex: i })
    if (r.result === null) break
    nurbs.push({ index: i, id: r.result })
  }
  console.log(`[10] fillet nurbs: ${nurbs.length}`)

  filewrite({ arcs, faces, lines, points, nurbs }, 'fillet-brep')
  await snapshot('fillet-result')
  return { partId }
}
