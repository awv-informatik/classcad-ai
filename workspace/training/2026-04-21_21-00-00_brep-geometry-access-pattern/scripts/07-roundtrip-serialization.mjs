export default async function (api, { snapshot, filewrite }) {
  // Round-trip: save edge positions → topology change → restore by position
  const partId = (await api.v1.part.create({ name: 'Roundtrip' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Step 1: Find all 4 vertical edges by position
  const verticals = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },
      { pos: [80, 0, 20] },
      { pos: [80, 60, 20] },
      { pos: [0, 60, 20] },
    ],
  })).result.lines
  console.log('[07] pre-change vertical IDs:', verticals)

  // Step 2: Serialize these edges to positions using getGeometryPositions
  const posR = await api.v1.part.getGeometryPositions({ elems: verticals })
  const savedPositions = posR.result.map(r => ({
    id: r.id,
    pos: r.positions[0], // single midpoint for lines
  }))
  console.log('[07] saved positions:', JSON.stringify(savedPositions))

  // Step 3: Make a topology change — fillet the top edges
  const topEdges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 40] },
      { pos: [80, 30, 40] },
      { pos: [40, 60, 40] },
      { pos: [0, 30, 40] },
    ],
  })).result.lines
  const filletId = (await api.v1.part.fillet({
    id: partId,
    references: topEdges,
    radius: 8,
  })).result
  await api.v1.common.recalc({})
  console.log('[07] fillet applied, topology changed')

  // Step 4: Restore vertical edges using saved positions
  const restoredEdges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: savedPositions.map(sp => ({ pos: [sp.pos.x, sp.pos.y, sp.pos.z] })),
  })).result.lines
  console.log('[07] restored vertical IDs:', restoredEdges)
  console.log('[07] any failures?', restoredEdges.some(id => Array.isArray(id)))

  // Step 5: Verify these are the right edges — get new positions and compare
  const validIds = restoredEdges.filter(id => !Array.isArray(id))
  if (validIds.length > 0) {
    const verifyPos = await api.v1.part.getGeometryPositions({ elems: validIds })
    const comparison = savedPositions.map((saved, i) => {
      const restored = verifyPos.result?.[i]?.positions?.[0]
      return {
        savedPos: saved.pos,
        restoredPos: restored,
        match: restored
          ? Math.abs(saved.pos.x - restored.x) < 0.01 &&
            Math.abs(saved.pos.y - restored.y) < 0.01 &&
            Math.abs(saved.pos.z - restored.z) < 0.01
          : false,
      }
    })
    console.log('[07] position match:', comparison.map(c => c.match))

    // Step 6: Use the restored edges for chamfer
    const chamferId = (await api.v1.part.chamfer({
      id: partId,
      references: validIds,
      distance1: 5,
    })).result
    console.log('[07] chamfer using restored edges:', chamferId != null ? '✓' : '❌')
    await snapshot('roundtrip-result')
  }

  filewrite({
    preChangeIds: verticals,
    savedPositions,
    postChangeIds: restoredEdges,
    allRestored: !restoredEdges.some(id => Array.isArray(id)),
    idsChanged: verticals.some((id, i) => id !== restoredEdges[i]),
  }, 'roundtrip')

  return { partId }
}
