export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylBrep' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 40, height: 60 })).result
  await api.v1.common.recalc({})

  // Enumerate all brep elements of cylinder
  const allResults = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, lineIndex: i })
    if (r.result) allResults.push({ type: 'line', index: i, id: r.result })
  }
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, arcIndex: i })
    if (r.result) allResults.push({ type: 'arc', index: i, id: r.result })
  }
  // Try nurbsCurveIndex too
  for (let i = 0; i < 3; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, nurbsCurveIndex: i })
    if (r.result) allResults.push({ type: 'nurbsCurve', index: i, id: r.result })
  }
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, faceIndex: i })
    if (r.result) allResults.push({ type: 'face', index: i, id: r.result })
  }
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, pointIndex: i })
    if (r.result) allResults.push({ type: 'point', index: i, id: r.result })
  }
  console.log('[12] cylinder brep elements:', JSON.stringify(allResults))

  // Get positions
  const elemIds = allResults.map(e => e.id)
  if (elemIds.length > 0) {
    const posR = await api.v1.part.getGeometryPositions({ elems: elemIds })
    for (const p of posR.result) {
      const elemInfo = allResults.find(e => e.id === p.id)
      console.log(`[12]   id:${p.id} (${elemInfo?.type} idx:${elemInfo?.index}) positions:`, JSON.stringify(p.positions))
    }
    filewrite(posR.result, 'cylinder-brep-positions')
  }

  filewrite(allResults, 'cylinder-brep-elements')

  // Now try: query cone arcs as circles (since circles = full 360)
  // Also try: cylinder "circles" — are they actually arcs or circles in the brep?

  return { partId }
}
