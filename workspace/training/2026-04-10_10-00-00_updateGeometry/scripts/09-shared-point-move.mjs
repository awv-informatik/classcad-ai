// Test: Does updating a shared point (endpoint of two connected lines) move both lines?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two connected lines (L shape) with coincidence
  const geo = await api.v1.sketch.geometry({
    id: skId,
    lines: [
      { startPos: [0, 0, 0], endPos: [50, 0, 0] },
      { startPos: [50, 0, 0], endPos: [50, 40, 0] },
    ],
    genFixation: false,
    genIncidence: true,
    genVertAndHoriz: false,
  })
  const [line1, line2] = geo.result.lines
  console.log('[09] created lines:', line1, line2)

  // Get point IDs for line1 and line2
  const pts1 = await api.v1.sketch.getPoints({ id: line1 })
  console.log('[09] line1 points:', JSON.stringify(pts1.result))

  const pts2 = await api.v1.sketch.getPoints({ id: line2 })
  console.log('[09] line2 points:', JSON.stringify(pts2.result))

  // Get positions of both lines before
  const pos1before = await api.v1.sketch.getPositions({ id: line1 })
  const pos2before = await api.v1.sketch.getPositions({ id: line2 })
  console.log('[09] line1 pos before:', JSON.stringify(pos1before.result))
  console.log('[09] line2 pos before:', JSON.stringify(pos2before.result))

  await snapshot('before')

  // The shared point should be line1's endId == line2's startId (if coincidence worked)
  const sharedPtId = pts1.result.endId
  console.log('[09] moving shared point (line1 endPt):', sharedPtId)

  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    points: [{ id: sharedPtId, pos: [70, 20, 0] }],
  })
  console.log('[09] updateGeometry result:', r.result, 'maxLevel:', r.maxLevel)

  // Get positions after update
  const pos1after = await api.v1.sketch.getPositions({ id: line1 })
  const pos2after = await api.v1.sketch.getPositions({ id: line2 })
  console.log('[09] line1 pos after:', JSON.stringify(pos1after.result))
  console.log('[09] line2 pos after:', JSON.stringify(pos2after.result))

  filewrite({
    line1Before: pos1before.result,
    line2Before: pos2before.result,
    line1After: pos1after.result,
    line2After: pos2after.result,
    sharedPtId,
    line1EndId: pts1.result.endId,
    line2StartId: pts2.result.startId,
  }, 'shared-point-comparison')

  await snapshot('after')

  return { partId }
}
