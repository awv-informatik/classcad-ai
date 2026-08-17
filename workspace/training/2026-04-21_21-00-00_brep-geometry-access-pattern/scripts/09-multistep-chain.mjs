export default async function (api, { snapshot, filewrite }) {
  // Complete multi-step chain: box → fillet top → chamfer bottom → fillet verticals
  // Each step: recalc → find edges → apply → verify
  const partId = (await api.v1.part.create({ name: 'MultiStep' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Step 1: Fillet all 4 top edges
  const topEdges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 40] }, { pos: [80, 30, 40] },
      { pos: [40, 60, 40] }, { pos: [0, 30, 40] },
    ],
  })).result.lines
  console.log('[09] step1 top edges:', topEdges.length, 'ids:', topEdges)
  const fillet1 = (await api.v1.part.fillet({
    id: partId,
    references: topEdges,
    radius: 6,
  })).result
  console.log('[09] step1 fillet:', fillet1 != null ? '✓' : '❌')
  await api.v1.common.recalc({})

  // Step 2: Chamfer all 4 bottom edges
  const bottomEdges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] }, { pos: [80, 30, 0] },
      { pos: [40, 60, 0] }, { pos: [0, 30, 0] },
    ],
  })).result.lines
  console.log('[09] step2 bottom edges:', bottomEdges.length, 'ids:', bottomEdges,
    'any empty?', bottomEdges.some(id => Array.isArray(id)))
  const chamfer1 = (await api.v1.part.chamfer({
    id: partId,
    references: bottomEdges.filter(id => !Array.isArray(id)),
    distance1: 4,
  })).result
  console.log('[09] step2 chamfer:', chamfer1 != null ? '✓' : '❌')
  await api.v1.common.recalc({})

  // Step 3: Fillet all 4 vertical edges
  // After 2 topology changes, can we still find the vertical edges?
  const vertEdges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] }, { pos: [80, 0, 20] },
      { pos: [80, 60, 20] }, { pos: [0, 60, 20] },
    ],
  })).result.lines
  console.log('[09] step3 vertical edges:', vertEdges.length, 'ids:', vertEdges,
    'any empty?', vertEdges.some(id => Array.isArray(id)))

  if (!vertEdges.some(id => Array.isArray(id))) {
    const fillet2 = (await api.v1.part.fillet({
      id: partId,
      references: vertEdges,
      radius: 5,
    })).result
    console.log('[09] step3 fillet verticals:', fillet2 != null ? '✓' : '❌')
    await snapshot('all-edges-treated')

    // Enumerate final topology
    await api.v1.common.recalc({})
    const finalLines = []
    for (let i = 0; ; i++) {
      const r = await api.v1.part.getBrepGeometryByIndex({ id: fillet2, lineIndex: i })
      if (r.result === null) break
      finalLines.push(r.result)
    }
    const finalArcs = []
    for (let i = 0; ; i++) {
      const r = await api.v1.part.getBrepGeometryByIndex({ id: fillet2, arcIndex: i })
      if (r.result === null) break
      finalArcs.push(r.result)
    }
    const finalFaces = []
    for (let i = 0; ; i++) {
      const r = await api.v1.part.getBrepGeometryByIndex({ id: fillet2, faceIndex: i })
      if (r.result === null) break
      finalFaces.push(r.result)
    }
    console.log('[09] final topology: lines:', finalLines.length, 'arcs:', finalArcs.length, 'faces:', finalFaces.length)

    filewrite({
      step1: { topEdges, filletId: fillet1 },
      step2: { bottomEdges, chamferId: chamfer1 },
      step3: { vertEdges, filletId: fillet2 },
      finalTopology: { lines: finalLines.length, arcs: finalArcs.length, faces: finalFaces.length },
    }, 'multistep')
  } else {
    console.log('[09] step3 FAILED to find some vertical edges')
    filewrite({
      step1: { topEdges, filletId: fillet1 },
      step2: { bottomEdges, chamferId: chamfer1 },
      step3: { vertEdges, error: 'some edges not found' },
    }, 'multistep')
  }

  return { partId }
}
