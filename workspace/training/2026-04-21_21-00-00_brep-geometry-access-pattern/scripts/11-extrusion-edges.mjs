export default async function (api, { snapshot, filewrite }) {
  // Test brep access on non-box geometry: L-shape via boolean union
  const partId = (await api.v1.part.create({ name: 'LShape' })).result
  const box1 = (await api.v1.part.box({ id: partId, length: 80, width: 30, height: 40 })).result
  const box2 = (await api.v1.part.box({
    id: partId,
    length: 40,
    width: 60,
    height: 40,
    position: [0, 0, 0],
  })).result
  const boolId = (await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [box2],
  })).result
  await api.v1.common.recalc({})

  await snapshot('l-shape')

  // Enumerate all edges on the boolean (latest) feature
  const allLines = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: boolId, lineIndex: i })
    if (r.result === null) break
    allLines.push(r.result)
  }
  console.log('[11] L-shape lines:', allLines.length)

  // Get positions for all edges
  const allPos = await api.v1.part.getGeometryPositions({ elems: allLines })

  // Classify edges by z-level
  const classified = allPos.result.map((r, i) => {
    const p = r.positions[0]
    let category = 'unknown'
    if (Math.abs(p.z) < 0.1) category = 'bottom'
    else if (Math.abs(p.z - 40) < 0.1) category = 'top'
    else category = 'vertical'
    return { index: i, id: allLines[i], pos: p, category }
  })

  const top = classified.filter(e => e.category === 'top')
  const bottom = classified.filter(e => e.category === 'bottom')
  const vertical = classified.filter(e => e.category === 'vertical')
  console.log('[11] top:', top.length, 'bottom:', bottom.length, 'vertical:', vertical.length)
  console.log('[11] vertical midpoints:', vertical.map(e => `[${e.pos.x.toFixed(0)},${e.pos.y.toFixed(0)},${e.pos.z.toFixed(0)}]`).join(' '))

  // Fillet all vertical edges
  const filletId = (await api.v1.part.fillet({
    id: partId,
    references: vertical.map(e => e.id),
    radius: 5,
  })).result
  console.log('[11] fillet verticals:', filletId != null ? '✓' : '❌')
  await snapshot('l-shape-filleted')

  // After fillet, find inner corner top edges for chamfer
  await api.v1.common.recalc({})
  // Inner corner on top: edges at approximately [60, 30, 40] and [40, 45, 40]
  const innerTopEdges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [60, 30, 40] },  // horizontal inner edge at junction
      { pos: [40, 45, 40] },  // vertical inner edge at junction
    ],
  })).result.lines
  console.log('[11] inner top edges:', innerTopEdges, 'any empty?', innerTopEdges.some(id => Array.isArray(id)))

  if (!innerTopEdges.some(id => Array.isArray(id))) {
    const chamferId = (await api.v1.part.chamfer({
      id: partId,
      references: innerTopEdges,
      distance1: 6,
    })).result
    console.log('[11] chamfer inner corners:', chamferId != null ? '✓' : '❌')
    await snapshot('l-shape-chamfered')
  }

  filewrite({
    edgeCounts: { total: allLines.length, top: top.length, bottom: bottom.length, vertical: vertical.length },
    classified: classified.map(c => ({ idx: c.index, cat: c.category, pos: c.pos })),
    innerTopEdges,
  }, 'l-shape-edges')

  return { partId }
}
