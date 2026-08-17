// Q2b: in script 02, l2.start landed at (55,0) not (50,0). Hypothesis: the solver STRETCHED the
// FIXED l1 (FIXATION locks position/direction, not length) so coincidence holds at (55,0).
// Measure BOTH lines this time. Then redo with both l1 endpoints individually fixed.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Snap2' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // case A: FIXATION on the line (as in 02)
  const skA = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'A' })).result
  const a1 = (await api.v1.sketch.line({ id: skA, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const a2 = (await api.v1.sketch.line({ id: skA, startPos: [55, 5, 0], endPos: [55, 40, 0] })).result
  const ap1 = (await api.v1.sketch.getPoints({ id: a1 })).result
  const ap2 = (await api.v1.sketch.getPoints({ id: a2 })).result
  await api.v1.sketch.constraint({ id: skA, type: 'FIXATION', geomIds: [a1] })
  await api.v1.sketch.constraint({ id: skA, type: 'COINCIDENT', geomIds: [ap1.endId, ap2.startId] })
  const a1after = (await api.v1.sketch.getPositions({ id: a1 })).result
  const a2after = (await api.v1.sketch.getPositions({ id: a2 })).result
  console.log('[06] A (line FIXATION): l1:', JSON.stringify(a1after), '— l2.start:', JSON.stringify(a2after.startPos))
  console.log('[06] A: coincidence satisfied:', Math.hypot(a1after.endPos.x - a2after.startPos.x, a1after.endPos.y - a2after.startPos.y) < 1e-9, '— fixed line stretched:', Math.abs(a1after.endPos.x - 50) > 1e-9)

  // case B: fix BOTH endpoints of l1 individually
  const skB = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'B' })).result
  const b1 = (await api.v1.sketch.line({ id: skB, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const b2 = (await api.v1.sketch.line({ id: skB, startPos: [55, 5, 0], endPos: [55, 40, 0] })).result
  const bp1 = (await api.v1.sketch.getPoints({ id: b1 })).result
  const bp2 = (await api.v1.sketch.getPoints({ id: b2 })).result
  await api.v1.sketch.constraint([
    { id: skB, type: 'FIXATION', geomIds: [bp1.startId] },
    { id: skB, type: 'FIXATION', geomIds: [bp1.endId] },
  ])
  await api.v1.sketch.constraint({ id: skB, type: 'COINCIDENT', geomIds: [bp1.endId, bp2.startId] })
  const b1after = (await api.v1.sketch.getPositions({ id: b1 })).result
  const b2after = (await api.v1.sketch.getPositions({ id: b2 })).result
  console.log('[06] B (both endpoints fixed): l1:', JSON.stringify(b1after), '— l2.start:', JSON.stringify(b2after.startPos), '(target (50,0))')

  filewrite({ a1after, a2after, b1after, b2after }, 'coincident2')
  return {}
}
