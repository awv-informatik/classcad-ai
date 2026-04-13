// Numerically verify mirrored coordinates
// Original line: (10,5) to (20,5), symmetry at x=30
// Expected mirror: (40,5) to (50,5)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Original line
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [10, 5, 0], endPos: [20, 5, 0] })).result

  // Symmetry at x=30
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [30, -10, 0], endPos: [30, 20, 0] })).result

  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: l1, symmetryLineId: symLine })

  // Get the copy rigid set's member geometry
  const copyRsId = r.result.geometry[1]
  const copyGeom = await api.v1.sketch.getGeometry({ id: copyRsId })
  const copyLineId = copyGeom.result.lines[0]
  console.log('[16] copy line ID:', copyLineId)

  // Get positions of original and copy
  const origPos = await api.v1.sketch.getPositions({ id: l1 })
  const copyPos = await api.v1.sketch.getPositions({ id: copyLineId })

  console.log('[16] original:', JSON.stringify(origPos.result))
  console.log('[16] copy:', JSON.stringify(copyPos.result))

  // Verify: for vertical mirror at x=30, point (x,y) -> (60-x, y)
  // (10,5) -> (50,5), (20,5) -> (40,5)
  const origStart = origPos.result.startPos
  const copyStart = copyPos.result.startPos
  const origEnd = origPos.result.endPos
  const copyEnd = copyPos.result.endPos

  console.log('[16] Expected copy start: (50,5), got:', `(${copyStart.x},${copyStart.y})`)
  console.log('[16] Expected copy end: (40,5), got:', `(${copyEnd.x},${copyEnd.y})`)

  filewrite({
    original: origPos.result,
    copy: copyPos.result,
    symmetryX: 30,
    expectedCopyStart: { x: 50, y: 5 },
    expectedCopyEnd: { x: 40, y: 5 }
  }, 'coords-verify')

  return { partId }
}
