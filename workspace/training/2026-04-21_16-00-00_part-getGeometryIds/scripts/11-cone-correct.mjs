export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeCorrect' })).result
  const coneId = (await api.v1.part.cone({
    id: partId, name: 'Cone1',
    bDiameter: 40, tDiameter: 10, height: 50,
  })).result
  await api.v1.common.recalc({})

  // From script 10: cone arcs at [-20, ~0, 0] (bottom) and [-5, ~0, 50] (top)
  // Query as arcs, not circles
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    arcs: [{ pos: [-20, 0, 0] }],
  })
  console.log('[11] bottom arc:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    arcs: [{ pos: [-5, 0, 50] }],
  })
  console.log('[11] top arc:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Conical face — use the 3 identifying positions from getGeometryPositions
  // face 1 (id 72): [[12.5, 0, 25], [-20, ~0, 0], [-5, ~0, 50]]
  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    cones: [{ positions: [[12.5, 0, 25], [-20, 0, 0], [-5, 0, 50]] }],
  })
  console.log('[11] cone face (3 exact pts):', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  // Try cone face with just 2 of the 3 positions
  const r4 = await api.v1.part.getGeometryIds({
    id: partId,
    cones: [{ positions: [[-20, 0, 0], [-5, 0, 50]] }],
  })
  console.log('[11] cone face (2 pts):', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  // Seam line
  const r5 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [12.5, 0, 25] }],
  })
  console.log('[11] seam line:', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)

  // Bottom flat face
  const r6 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[-20, 0, 0]] }],
  })
  console.log('[11] bottom face:', JSON.stringify(r6.result), 'maxLevel:', r6.maxLevel)

  // Top flat face
  const r7 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[-5, 0, 50]] }],
  })
  console.log('[11] top face:', JSON.stringify(r7.result), 'maxLevel:', r7.maxLevel)

  filewrite({ bottomArc: r1.result, topArc: r2.result, coneFace3: r3.result, coneFace2: r4.result, seamLine: r5.result, bottomFace: r6.result, topFace: r7.result }, 'cone-correct-results')

  return { partId }
}
