// Test getGeometry after creating mixed geometry (points, lines, arcs, circles)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create mixed geometry via batch
  const geo = await api.v1.sketch.geometry({
    id: skId,
    points: [{ pos: [0, 0, 0] }],
    lines: [
      { startPos: [10, 0, 0], endPos: [60, 0, 0] },
      { startPos: [60, 0, 0], endPos: [60, 40, 0] },
    ],
    circles: [{ centerPos: [30, 20, 0], radius: 10 }],
    arcsByCenter: [{ startPos: [0, 40, 0], endPos: [40, 40, 0], centerPos: [20, 40, 0] }],
    genFixation: false,
    genIncidence: false,
    genTangency: false,
    genVertAndHoriz: false,
  })

  console.log('[02] created IDs:', JSON.stringify(geo.result))

  const r = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[02] getGeometry result:', JSON.stringify(r.result))
  console.log('[02] maxLevel:', r.maxLevel)

  // Compare: are returned IDs the same as creation IDs?
  filewrite({
    created: geo.result,
    queried: r.result,
    pointsMatch: JSON.stringify(geo.result.points) === JSON.stringify(r.result.points),
    linesMatch: JSON.stringify(geo.result.lines) === JSON.stringify(r.result.lines),
    circlesMatch: JSON.stringify(geo.result.circles) === JSON.stringify(r.result.circles),
  }, 'comparison')

  await snapshot('mixed')
  return { partId, skId }
}
