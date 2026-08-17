// Test HORIZONTAL and VERTICAL constraints on TWO POINTS (not lines)
// The docs example shows: constraint({ id: sketch, type: 'HORIZONTAL', geomIds: [pointId1, pointId2] })
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two standalone points at different heights
  const pt1Id = (await api.v1.sketch.point({
    id: skId, pos: [10, 20, 0], genFixation: false,
  })).result
  const pt2Id = (await api.v1.sketch.point({
    id: skId, pos: [50, 35, 0], genFixation: false,
  })).result
  console.log('[16] pt1Id:', pt1Id, 'pt2Id:', pt2Id)

  // HORIZONTAL between two points — should make them same Y
  const r1 = await api.v1.sketch.constraint({
    id: skId, type: 'HORIZONTAL', geomIds: [pt1Id, pt2Id],
  })
  console.log('[16] horiz-points result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[16] horiz-points messages:', JSON.stringify(r1.messages))

  // Check positions
  const pos1 = (await api.v1.sketch.getPositions({ id: pt1Id })).result
  const pos2 = (await api.v1.sketch.getPositions({ id: pt2Id })).result
  console.log('[16] after horiz - pt1:', JSON.stringify(pos1), 'pt2:', JSON.stringify(pos2))

  // Now two more points for VERTICAL
  const pt3Id = (await api.v1.sketch.point({
    id: skId, pos: [70, 10, 0], genFixation: false,
  })).result
  const pt4Id = (await api.v1.sketch.point({
    id: skId, pos: [80, 50, 0], genFixation: false,
  })).result

  const r2 = await api.v1.sketch.constraint({
    id: skId, type: 'VERTICAL', geomIds: [pt3Id, pt4Id],
  })
  console.log('[16] vert-points result:', r2.result, 'maxLevel:', r2.maxLevel)

  const pos3 = (await api.v1.sketch.getPositions({ id: pt3Id })).result
  const pos4 = (await api.v1.sketch.getPositions({ id: pt4Id })).result
  console.log('[16] after vert - pt3:', JSON.stringify(pos3), 'pt4:', JSON.stringify(pos4))

  filewrite({
    horizPoints: { result: r1.result, maxLevel: r1.maxLevel, after: { pt1: pos1, pt2: pos2 } },
    vertPoints: { result: r2.result, maxLevel: r2.maxLevel, after: { pt3: pos3, pt4: pos4 } },
  }, 'horiz-vert-points-response')

  await snapshot('horiz-vert-points')
  return { partId }
}
