// Probe: (a) does TANGENT accept ARC-ARC? (b) RADIUS/DIAMETER dims on arcs? (c) COINCIDENT
// between arc endpoints? Decides boss strategy: constrained 4-arc chain vs circles+trim.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcProbe' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result

  // two rough arcs that should join smoothly: a1 fixed-ish, a2 floating
  const a1 = (await api.v1.sketch.arcByCenter({ id: skId, startPos: [20, 0, 0], centerPos: [0, 0, 0], endPos: [0, 20, 0], isClockwise: false })).result
  const a2 = (await api.v1.sketch.arcByCenter({ id: skId, startPos: [5, 28, 0], centerPos: [8, 36, 0], endPos: [14, 40, 0], isClockwise: true })).result
  const p1 = (await api.v1.sketch.getPoints({ id: a1 })).result
  const p2 = (await api.v1.sketch.getPoints({ id: a2 })).result

  const fx = await api.v1.sketch.constraint([
    { id: skId, type: 'FIXATION', geomIds: [p1.centerId] },
    { id: skId, type: 'FIXATION', geomIds: [p1.startId] },
    { id: skId, type: 'FIXATION', geomIds: [p1.endId] },
  ])
  console.log('[00] fixations maxLevel:', fx.maxLevel)

  // (b) radius dim on arc a2
  const rd = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [a2], value: 10 })
  console.log('[00] RADIUS on arc maxLevel:', rd.maxLevel, 'result:', rd.result)

  // (c) coincident arc-end to arc-end
  const co = await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [p1.endId, p2.startId] })
  console.log('[00] COINCIDENT arc-arc endpoints maxLevel:', co.maxLevel, 'result:', co.result)

  // (a) tangent arc-arc
  const tg = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [a2, a1] })
  console.log('[00] TANGENT arc-arc maxLevel:', tg.maxLevel, 'result:', tg.result, JSON.stringify(tg.messages ?? []))

  const q1 = (await api.v1.sketch.getPositions({ id: a1 })).result
  const q2 = (await api.v1.sketch.getPositions({ id: a2 })).result
  console.log('[00] a1:', JSON.stringify(q1))
  console.log('[00] a2:', JSON.stringify(q2))
  // tangency check: at shared point, both radii directions colinear → |c2-c1| == r1±r2
  const r1 = Math.hypot(q1.startPos.x - q1.centerPos.x, q1.startPos.y - q1.centerPos.y)
  const r2 = Math.hypot(q2.startPos.x - q2.centerPos.x, q2.startPos.y - q2.centerPos.y)
  const dc = Math.hypot(q2.centerPos.x - q1.centerPos.x, q2.centerPos.y - q1.centerPos.y)
  console.log('[00] r1:', r1.toFixed(6), 'r2:', r2.toFixed(6), 'centerDist:', dc.toFixed(6), '→ tangent if r1+r2 or |r1-r2|')

  filewrite({ q1, q2, r1, r2, dc }, 'arcprobe')
  return {}
}
