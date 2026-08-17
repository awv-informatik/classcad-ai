// 03 — two circles intersecting at 2 points -> each splits into 2 arcs at (30,+/-40,0).
// Read arc endpoints (getPositions works on arcs); record intervals (note negative-start / asymmetry).
import { makeSketch, circle, positions, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const C1 = await circle(api, skId, [0, 0, 0], 50)
  const C2 = await circle(api, skId, [60, 0, 0], 50)
  // analytic intersections of |P|=50 and |P-(60,0)|=50: x=30, y=+/-40
  const r = await api.v1.sketch.preTrim({ id: skId })
  const e1 = r.result.find(e => e.sourceId === C1)
  const e2 = r.result.find(e => e.sourceId === C2)

  async function arcs(e) {
    const out = []
    for (const s of e.splittedCurves) { const p = await positions(api, s.id); out.push({ iv: s.interval, start: p.startPos, end: p.endPos }) }
    return out
  }
  const a1 = await arcs(e1), a2 = await arcs(e2)
  filewrite({ C1: { intervals: e1.splittedCurves.map(s => s.interval), arcs: a1 }, C2: { intervals: e2.splittedCurves.map(s => s.interval), arcs: a2 } }, '03-circle-circle')
  console.log('[03] C1 arcs', e1.splittedCurves.length, 'intervals', JSON.stringify(e1.splittedCurves.map(s => s.interval)))
  for (const p of a1) console.log('[03]   C1 arc', JSON.stringify(p.iv), JSON.stringify(p.start), '->', JSON.stringify(p.end))
  console.log('[03] C2 arcs', e2.splittedCurves.length, 'intervals', JSON.stringify(e2.splittedCurves.map(s => s.interval)))
  for (const p of a2) console.log('[03]   C2 arc', JSON.stringify(p.iv), JSON.stringify(p.start), '->', JSON.stringify(p.end))

  // endpoints must be the two intersection points (30,+/-40)
  const onIntersections = arr => arr.every(p =>
    [p.start, p.end].every(v => vecApprox(v, [30, 40, 0], 1e-4) || vecApprox(v, [30, -40, 0], 1e-4)))
  const checks = {
    C1_twoArcs: e1.splittedCurves.length === 2,
    C2_twoArcs: e2.splittedCurves.length === 2,
    C1_endpointsOnIntersections: onIntersections(a1),
    C2_endpointsOnIntersections: onIntersections(a2),
    intervalsNot01: e1.splittedCurves.concat(e2.splittedCurves).every(s => JSON.stringify(s.interval) !== '[0,1]'),
  }
  console.log('[03] CHECKS', JSON.stringify(checks))
  console.log('[03]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks, C1_intervals: e1.splittedCurves.map(s => s.interval), C2_intervals: e2.splittedCurves.map(s => s.interval) }
}
