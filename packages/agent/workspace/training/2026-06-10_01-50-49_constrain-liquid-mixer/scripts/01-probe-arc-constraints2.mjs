// Probe v2: rough arcs seeded VALIDLY (center+radius+angles → endpoints).
// (a) TANGENT arc-arc? (b) RADIUS dim on arc? (c) COINCIDENT arc endpoints?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcProbe2' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result

  const arc = (cx, cy, r, a0, a1deg, cw = false) => ({
    startPos: [cx + r * Math.cos(a0 * Math.PI / 180), cy + r * Math.sin(a0 * Math.PI / 180), 0],
    endPos: [cx + r * Math.cos(a1deg * Math.PI / 180), cy + r * Math.sin(a1deg * Math.PI / 180), 0],
    centerPos: [cx, cy, 0],
    isClockwise: cw,
  })

  const a1 = (await api.v1.sketch.arcByCenter({ id: skId, ...arc(0, 0, 20, 0, 90) })).result
  const a2 = (await api.v1.sketch.arcByCenter({ id: skId, ...arc(8, 36, 8, 250, 10, true) })).result
  console.log('[01] arcs created:', a1, a2)
  const p1 = (await api.v1.sketch.getPoints({ id: a1 })).result
  const p2 = (await api.v1.sketch.getPoints({ id: a2 })).result

  await api.v1.sketch.constraint([
    { id: skId, type: 'FIXATION', geomIds: [p1.centerId] },
    { id: skId, type: 'FIXATION', geomIds: [p1.startId] },
    { id: skId, type: 'FIXATION', geomIds: [p1.endId] },
  ])

  const rd = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [a2], value: 10 })
  console.log('[01] RADIUS on arc: maxLevel', rd.maxLevel, 'result', rd.result)

  const co = await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [p1.endId, p2.startId] })
  console.log('[01] COINCIDENT arc-end/arc-end: maxLevel', co.maxLevel, 'result', co.result)

  const tg = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [a2, a1] })
  console.log('[01] TANGENT arc-arc: maxLevel', tg.maxLevel, 'result', tg.result, JSON.stringify(tg.messages ?? []))

  const q1 = (await api.v1.sketch.getPositions({ id: a1 })).result
  const q2 = (await api.v1.sketch.getPositions({ id: a2 })).result
  const r1 = Math.hypot(q1.startPos.x - q1.centerPos.x, q1.startPos.y - q1.centerPos.y)
  const r2 = Math.hypot(q2.startPos.x - q2.centerPos.x, q2.startPos.y - q2.centerPos.y)
  const dc = Math.hypot(q2.centerPos.x - q1.centerPos.x, q2.centerPos.y - q1.centerPos.y)
  const shared = Math.hypot(q2.startPos.x - q1.endPos.x, q2.startPos.y - q1.endPos.y)
  console.log('[01] r1:', r1.toFixed(6), 'r2:', r2.toFixed(6), 'centerDist:', dc.toFixed(6), 'sharedGap:', shared.toExponential(2))
  console.log('[01] tangency holds:', Math.abs(dc - (r1 + r2)) < 1e-6 || Math.abs(dc - Math.abs(r1 - r2)) < 1e-6)

  filewrite({ q1, q2, r1, r2, dc, shared }, 'arcprobe2')
  return {}
}
