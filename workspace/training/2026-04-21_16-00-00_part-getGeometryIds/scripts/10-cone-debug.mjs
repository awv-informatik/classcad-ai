export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeDebug' })).result

  // Simple cone at origin, no position offset
  const coneId = (await api.v1.part.cone({
    id: partId, name: 'Cone1',
    bDiameter: 40, tDiameter: 10, height: 50,
  })).result

  await api.v1.common.recalc({})
  console.log('[10] partId:', partId, 'coneId:', coneId)

  // Get all brep geometry using getGeometryPositions
  // First, need to find the brep element IDs. Use getBrepGeometryByIndex to enumerate
  const allResults = []
  // Try lineIndex 0..5
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: coneId, lineIndex: i })
    if (r.result) allResults.push({ type: 'line', index: i, id: r.result })
  }
  // Try arcIndex 0..5
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: coneId, arcIndex: i })
    if (r.result) allResults.push({ type: 'arc', index: i, id: r.result })
  }
  // Try faceIndex 0..5
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: coneId, faceIndex: i })
    if (r.result) allResults.push({ type: 'face', index: i, id: r.result })
  }
  // Try pointIndex 0..10
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: coneId, pointIndex: i })
    if (r.result) allResults.push({ type: 'point', index: i, id: r.result })
  }

  console.log('[10] all brep elements:', JSON.stringify(allResults))

  // Get positions for all found elements
  const elemIds = allResults.map(e => e.id)
  if (elemIds.length > 0) {
    const posR = await api.v1.part.getGeometryPositions({ elems: elemIds })
    console.log('[10] element positions:')
    for (const p of posR.result) {
      const elemInfo = allResults.find(e => e.id === p.id)
      console.log(`[10]   id:${p.id} (${elemInfo?.type} idx:${elemInfo?.index}) positions:`, JSON.stringify(p.positions))
    }
    filewrite(posR.result, 'cone-positions')
  }

  filewrite(allResults, 'cone-brep-elements')

  // Now try conical face with edge midpoint positions
  // From getGeometryPositions, the faces should give us the right positions to use

  await snapshot('cone-debug')
  return { partId }
}
