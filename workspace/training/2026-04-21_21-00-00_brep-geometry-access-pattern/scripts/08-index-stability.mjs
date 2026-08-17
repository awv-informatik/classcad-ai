export default async function (api, { snapshot, filewrite }) {
  // Test whether brep indices are stable across topology changes
  // When using getBrepGeometryByIndex on the LATEST feature, do indices map to the same geometric edges?
  const partId = (await api.v1.part.create({ name: 'IndexStab' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get all 12 box edges with their indices and positions
  const boxEdges = []
  for (let i = 0; i < 12; i++) {
    const id = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: i })).result
    const pos = (await api.v1.part.getGeometryPositions({ elems: [id] })).result[0]
    boxEdges.push({ index: i, id, pos: pos.positions[0] })
  }
  console.log('[08] box edges:', boxEdges.map(e => `${e.index}:[${e.pos.x},${e.pos.y},${e.pos.z}]`).join(' '))

  // Fillet 2 top edges → topology changes → box feature still exists but brep is modified
  const topEdge1 = boxEdges.find(e => Math.abs(e.pos.z - 40) < 0.1 && Math.abs(e.pos.y) < 0.1)
  const topEdge2 = boxEdges.find(e => Math.abs(e.pos.z - 40) < 0.1 && Math.abs(e.pos.x - 80) < 0.1)
  const filletId = (await api.v1.part.fillet({
    id: partId,
    references: [topEdge1.id, topEdge2.id],
    radius: 6,
  })).result
  await api.v1.common.recalc({})

  // Now enumerate the FILLET feature's edges — does it include ALL edges of the solid?
  const filletLines = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, lineIndex: i })
    if (r.result === null) break
    filletLines.push({ index: i, id: r.result })
  }
  const filletArcs = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, arcIndex: i })
    if (r.result === null) break
    filletArcs.push({ index: i, id: r.result })
  }
  console.log('[08] fillet feature: lines:', filletLines.length, 'arcs:', filletArcs.length)

  // Get positions for fillet feature lines and compare with original box edges
  const filletLinePositions = []
  for (const fl of filletLines) {
    const pos = (await api.v1.part.getGeometryPositions({ elems: [fl.id] })).result[0]
    filletLinePositions.push({ index: fl.index, id: fl.id, pos: pos.positions[0] })
  }

  // Try: can we still use the BOX feature for getBrepGeometryByIndex after fillet?
  const boxAfterFillet = []
  for (let i = 0; i < 12; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: i })
    if (r.result === null) {
      boxAfterFillet.push({ index: i, id: null })
    } else {
      const pos = (await api.v1.part.getGeometryPositions({ elems: [r.result] })).result
      boxAfterFillet.push({
        index: i,
        id: r.result,
        pos: pos?.[0]?.positions?.[0] || null,
      })
    }
  }
  console.log('[08] box feature after fillet: still has', boxAfterFillet.filter(e => e.id !== null).length, 'lines')

  // Compare: do box indices map to the same geometric positions after fillet?
  const indexMapping = boxEdges.map((be, i) => {
    const after = boxAfterFillet[i]
    return {
      index: i,
      before: `[${be.pos.x},${be.pos.y},${be.pos.z}]`,
      afterId: after.id,
      afterPos: after.pos ? `[${after.pos.x},${after.pos.y},${after.pos.z}]` : 'null',
      samePos: after.pos
        ? Math.abs(be.pos.x - after.pos.x) < 0.5 &&
          Math.abs(be.pos.y - after.pos.y) < 0.5 &&
          Math.abs(be.pos.z - after.pos.z) < 0.5
        : false,
    }
  })
  console.log('[08] index mapping preserved?', indexMapping.map(m => m.samePos))

  filewrite({
    boxEdges: boxEdges.map(e => ({ index: e.index, id: e.id, pos: e.pos })),
    boxAfterFillet: boxAfterFillet,
    filletLines: filletLinePositions,
    filletArcs,
    indexMapping,
  }, 'index-stability')

  return { partId }
}
