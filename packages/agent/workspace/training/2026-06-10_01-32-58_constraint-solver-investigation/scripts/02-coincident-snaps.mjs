// Q2: with planeId, does COINCIDENT physically SNAP endpoints together? Does HORIZONTAL rotate a line?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Snap' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'WithPlane' })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [55, 5, 0], endPos: [55, 40, 0] })).result
  const p1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const p2 = (await api.v1.sketch.getPoints({ id: l2 })).result

  // anchor l1 so the solver moves l2
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })
  const cR = await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [p1.endId, p2.startId] })
  const l2after = (await api.v1.sketch.getPositions({ id: l2 })).result
  const snapped = Math.abs(l2after.startPos.x - 50) < 1e-6 && Math.abs(l2after.startPos.y - 0) < 1e-6
  console.log('[02] COINCIDENT maxLevel:', cR.maxLevel, 'l2.start:', JSON.stringify(l2after.startPos), snapped ? '→ SNAPPED to (50,0) ✓' : '→ did not move ❌')

  // tilted line + HORIZONTAL
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [0, 60, 0], endPos: [40, 90, 0] })).result
  const hR = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l3] })
  const l3after = (await api.v1.sketch.getPositions({ id: l3 })).result
  const dy = l3after.endPos.y - l3after.startPos.y
  const len = Math.hypot(l3after.endPos.x - l3after.startPos.x, dy)
  console.log('[02] HORIZONTAL maxLevel:', hR.maxLevel, 'l3 after:', JSON.stringify(l3after), '— dy:', dy.toFixed(9), 'len:', len.toFixed(4), '(was tilted, len 50)')

  filewrite({ l2after, l3after, dy, len }, 'snap')
  return { snapped, dy }
}
