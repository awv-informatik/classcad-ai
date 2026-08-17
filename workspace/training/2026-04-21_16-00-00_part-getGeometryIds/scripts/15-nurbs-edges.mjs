export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NurbsTest' })).result

  // Create a sphere — the sphere has NURBS edges where the equator/meridians intersect
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 30 })).result
  await api.v1.common.recalc({})

  // Enumerate sphere brep elements
  const allResults = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: sphId, lineIndex: i })
    if (r.result) allResults.push({ type: 'line', index: i, id: r.result })
  }
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: sphId, arcIndex: i })
    if (r.result) allResults.push({ type: 'arc', index: i, id: r.result })
  }
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: sphId, nurbsCurveIndex: i })
    if (r.result) allResults.push({ type: 'nurbsCurve', index: i, id: r.result })
  }
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: sphId, faceIndex: i })
    if (r.result) allResults.push({ type: 'face', index: i, id: r.result })
  }
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: sphId, pointIndex: i })
    if (r.result) allResults.push({ type: 'point', index: i, id: r.result })
  }
  console.log('[15] sphere brep elements:', JSON.stringify(allResults))

  // Get positions
  const elemIds = allResults.map(e => e.id)
  if (elemIds.length > 0) {
    const posR = await api.v1.part.getGeometryPositions({ elems: elemIds })
    for (const p of posR.result) {
      const elemInfo = allResults.find(e => e.id === p.id)
      console.log(`[15]   id:${p.id} (${elemInfo?.type} idx:${elemInfo?.index}) positions:`, JSON.stringify(p.positions))
    }
    filewrite(posR.result, 'sphere-brep-positions')
  }

  // Try sphere face query
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    spheres: [{ positions: [[30, 0, 0], [0, 30, 0]] }],
  })
  console.log('[15] sphere face:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  filewrite(allResults, 'sphere-brep-elements')
  await snapshot('sphere-brep')
  return { partId }
}
