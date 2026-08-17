export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Fillet an edge
  const edgeResult = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })
  const edgeId = edgeResult.result.lines[0]
  const filletId = (await api.v1.part.fillet({ id: partId, references: [edgeId], radius: 10 })).result
  await api.v1.common.recalc({})

  // Enumerate arcs using getBrepGeometryByIndex
  const arcs = []
  for (let i = 0; i < 20; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, arcIndex: i })
    if (r.result && r.result !== 'VOID') {
      arcs.push({ index: i, id: r.result })
      console.log('[13] arc index', i, '→ id:', r.result)
    } else {
      break
    }
  }
  console.log('[13] total arcs found:', arcs.length)

  if (arcs.length > 0) {
    const arcIds = arcs.map(a => a.id)
    const r = await api.v1.part.getGeometryPositions({ elems: arcIds })
    console.log('[13] maxLevel:', r.maxLevel)
    for (const item of r.result) {
      console.log('[13] id:', item.id, 'positions count:', item.positions.length, 'positions:', JSON.stringify(item.positions))
    }
    filewrite({ arcs, positions: r.result, maxLevel: r.maxLevel }, 'arcs-via-brep-index')
  }

  await snapshot('fillet-arcs')
  return { partId }
}
