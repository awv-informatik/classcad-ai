export default async function (api, { snapshot, filewrite }) {
  // Enumerate all box edges, classify them by position, fillet a subset
  const partId = (await api.v1.part.create({ name: 'EnumSelect' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Enumerate all 12 box lines with positions
  const allEdges = []
  for (let i = 0; i < 12; i++) {
    const edgeId = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: i })).result
    const pos = (await api.v1.part.getGeometryPositions({ elems: [edgeId] })).result[0]
    allEdges.push({
      index: i,
      id: edgeId,
      midpoint: pos.positions[0],
    })
  }

  // Classify edges: top (z=40), bottom (z=0), vertical (varying z)
  const topEdges = allEdges.filter(e => Math.abs(e.midpoint.z - 40) < 0.1)
  const bottomEdges = allEdges.filter(e => Math.abs(e.midpoint.z) < 0.1)
  const verticalEdges = allEdges.filter(e => Math.abs(e.midpoint.z - 20) < 0.1)

  console.log('[04] top edges:', topEdges.length, 'ids:', topEdges.map(e => e.id))
  console.log('[04] bottom edges:', bottomEdges.length, 'ids:', bottomEdges.map(e => e.id))
  console.log('[04] vertical edges:', verticalEdges.length, 'ids:', verticalEdges.map(e => e.id))

  // Fillet ALL top edges in one call
  const filletId = (await api.v1.part.fillet({
    id: partId,
    references: topEdges.map(e => e.id),
    radius: 6,
  })).result
  console.log('[04] fillet all top edges:', filletId != null ? '✓' : '❌')

  await snapshot('top-edges-filleted')

  // Chamfer ALL bottom edges in one call
  await api.v1.common.recalc({})
  const bottomIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: bottomEdges.map(e => ({ pos: [e.midpoint.x, e.midpoint.y, e.midpoint.z] })),
  })).result.lines
  console.log('[04] re-found bottom edges post-fillet:', bottomIds, 'any empty?', bottomIds.some(id => Array.isArray(id) && id.length === 0))

  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: bottomIds.filter(id => !Array.isArray(id)),
    distance1: 4,
  })).result
  console.log('[04] chamfer all bottom edges:', chamferId != null ? '✓' : '❌')

  await snapshot('top-fillet-bottom-chamfer')

  filewrite({
    allEdges: allEdges.map(e => ({
      index: e.index,
      id: e.id,
      midpoint: e.midpoint,
      category: Math.abs(e.midpoint.z - 40) < 0.1 ? 'top' : Math.abs(e.midpoint.z) < 0.1 ? 'bottom' : 'vertical',
    })),
    topEdgeIds: topEdges.map(e => e.id),
    bottomEdgeIds: bottomEdges.map(e => e.id),
    verticalEdgeIds: verticalEdges.map(e => e.id),
    reFountBottomIds: bottomIds,
    filletId,
    chamferId,
  }, 'enumeration')

  return { partId }
}
