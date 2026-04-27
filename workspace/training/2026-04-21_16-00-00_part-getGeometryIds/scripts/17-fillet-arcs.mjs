export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletArcs' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Fillet the front-left vertical edge
  const edgeR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })
  const edgeId = edgeR.result.lines[0]
  const filletId = (await api.v1.part.fillet({
    id: partId, name: 'Fillet1', references: [edgeId], radius: 8,
  })).result
  await api.v1.common.recalc({})

  // Enumerate fillet brep to find arc positions
  const allResults = []
  for (let i = 0; i < 20; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, arcIndex: i })
    if (r.result) allResults.push({ type: 'arc', index: i, id: r.result })
    else break
  }
  for (let i = 0; i < 20; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, lineIndex: i })
    if (r.result) allResults.push({ type: 'line', index: i, id: r.result })
    else break
  }
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, faceIndex: i })
    if (r.result) allResults.push({ type: 'face', index: i, id: r.result })
    else break
  }
  console.log('[17] fillet brep:', JSON.stringify(allResults))

  const elemIds = allResults.map(e => e.id)
  const posR = await api.v1.part.getGeometryPositions({ elems: elemIds })
  for (const p of posR.result) {
    const elemInfo = allResults.find(e => e.id === p.id)
    console.log(`[17]   id:${p.id} (${elemInfo?.type} idx:${elemInfo?.index}) pos:`, JSON.stringify(p.positions))
  }

  // Now try to find fillet arcs using the positions from getGeometryPositions
  const arcPositions = posR.result.filter(p => allResults.find(e => e.id === p.id)?.type === 'arc')
  if (arcPositions.length > 0) {
    const firstArcPos = arcPositions[0].positions[0]
    const r = await api.v1.part.getGeometryIds({
      id: partId,
      arcs: [{ pos: [firstArcPos.x, firstArcPos.y, firstArcPos.z] }],
    })
    console.log('[17] fillet arc via position:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)
  }

  filewrite({ brepElements: allResults, positions: posR.result }, 'fillet-brep')
  await snapshot('fillet-arcs')
  return { partId }
}
