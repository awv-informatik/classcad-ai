// Verify mirrored geometry positions numerically using getPositions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line from (10,5) to (20,5)
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [10, 5, 0], endPos: [20, 5, 0] })).result

  // Symmetry line at x=30 (vertical)
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [30, -10, 0], endPos: [30, 20, 0] })).result

  // Mirror using single geometry as rigidSetId
  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: l1, symmetryLineId: symLine })
  console.log('[12] result:', JSON.stringify(r.result))

  // Get positions of original line endpoints
  const origPts = await api.v1.sketch.getPositions({ id: l1 })
  console.log('[12] original positions:', JSON.stringify(origPts.result))

  // The copy rigid set is geometry[1] — get its member geometry
  // First, get the points of the copy rigid set members
  const copyRsId = r.result.geometry[1]

  // Try getPositions on the rigid set itself
  const copyPts = await api.v1.sketch.getPositions({ id: copyRsId })
  console.log('[12] copy RS positions:', JSON.stringify(copyPts.result))
  console.log('[12] copy RS maxLevel:', copyPts.maxLevel)

  // Get geometry IDs inside the copy rigid set via getGeometry
  const copyGeom = await api.v1.sketch.getGeometry({ id: copyRsId })
  console.log('[12] copy RS getGeometry:', JSON.stringify(copyGeom.result))
  console.log('[12] copy RS getGeometry maxLevel:', copyGeom.maxLevel)

  filewrite({
    original: origPts.result,
    copyRs: copyPts.result,
    copyGeom: copyGeom.result,
    mirrorResult: r.result
  }, 'positions')

  await snapshot('verify-positions')
  return { partId }
}
