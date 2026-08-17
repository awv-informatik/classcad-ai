export default async function (api, { snapshot, filewrite }) {
  // Find fillet arc edges after filleting — what type are they? lines? arcs?
  const partId = (await api.v1.part.create({ name: 'FindArcs' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Fillet one edge
  const edge = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines[0]
  const filletId = (await api.v1.part.fillet({
    id: partId,
    references: [edge],
    radius: 8,
  })).result
  await api.v1.common.recalc({})

  // Enumerate ALL types on the fillet feature
  const counts = {}
  for (const type of ['lineIndex', 'arcIndex', 'faceIndex', 'pointIndex']) {
    let count = 0
    for (let i = 0; ; i++) {
      const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, [type]: i })
      if (r.result === null) break
      count++
    }
    counts[type] = count
  }
  console.log('[10] fillet feature counts:', JSON.stringify(counts))

  // Now add chamfer on another edge → check if the CHAMFER feature has arcs
  const edge2 = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [80, 30, 0] }],
  })).result.lines[0]
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: [edge2],
    distance1: 5,
  })).result
  await api.v1.common.recalc({})

  const chamferCounts = {}
  for (const type of ['lineIndex', 'arcIndex', 'faceIndex', 'pointIndex']) {
    let count = 0
    for (let i = 0; ; i++) {
      const r = await api.v1.part.getBrepGeometryByIndex({ id: chamferId, [type]: i })
      if (r.result === null) break
      count++
    }
    chamferCounts[type] = count
  }
  console.log('[10] chamfer feature (after fillet) counts:', JSON.stringify(chamferCounts))

  // Now fillet a VERTICAL edge → last feature → check arcs
  const edge3 = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })).result.lines[0]
  const fillet2Id = (await api.v1.part.fillet({
    id: partId,
    references: [edge3],
    radius: 5,
  })).result
  await api.v1.common.recalc({})

  const fillet2Counts = {}
  for (const type of ['lineIndex', 'arcIndex', 'faceIndex', 'pointIndex']) {
    let count = 0
    for (let i = 0; ; i++) {
      const r = await api.v1.part.getBrepGeometryByIndex({ id: fillet2Id, [type]: i })
      if (r.result === null) break
      count++
    }
    fillet2Counts[type] = count
  }
  console.log('[10] fillet2 feature (after fillet+chamfer) counts:', JSON.stringify(fillet2Counts))

  // Now try getGeometryIds to find arcs by position on the fillet surface
  // The first fillet was at [40, 0, 40] with radius 8, so the fillet arc midpoint
  // should be roughly at [40, 0, 40-8*cos(45)] = [40, 0, 34.34]
  // and at the fillet-face-edge boundary
  const arcSearch = await api.v1.part.getGeometryIds({
    id: partId,
    arcs: [
      { pos: [0, 0, 32] },   // near the fillet2 midpoint region
      { pos: [40, 0, 34] },  // near the first fillet midpoint region
    ],
  })
  console.log('[10] arc search near fillet midpoints:', JSON.stringify(arcSearch.result), 'maxLevel:', arcSearch.maxLevel)

  await snapshot('after-all')

  filewrite({
    filletCounts: counts,
    chamferCounts,
    fillet2Counts,
    arcSearch: arcSearch.result,
  }, 'fillet-arcs')

  return { partId }
}
