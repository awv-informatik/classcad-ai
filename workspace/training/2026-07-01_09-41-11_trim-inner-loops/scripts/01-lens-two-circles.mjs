// 01 — INNER LOOP: intersection lens of two circles. Discard the outer arcs.
//
// PREDICTION (theoretic shape): two circles C1(0,0,r50), C2(60,0,r50) meet at (30,+/-40). The inner loop is the
// vesica lens = the region inside BOTH circles, bounded by C1's inner arc (through (50,0)) and C2's inner arc
// (through (10,0)). Realized outcome should be: exactly 2 arcs, endpoints at (30,+/-40), each a MINOR arc
// (|bulge| < 1, ~106deg), spanning x in [10,50] — a tall pointed lens. Rule: DEPTH_AT_LEAST(2).
import { makeSketch, circle, positions } from './_setup.mjs'
import { classify, DEPTH_AT_LEAST } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  console.log('[01] PREDICT: 2 minor arcs (lens), endpoints (30,+/-40), x in [10,50], discard outer arcs')
  const { skId } = await makeSketch(api)
  await circle(api, skId, [0, 0, 0], 50)
  await circle(api, skId, [60, 0, 0], 50)
  await snapshot('01-before')

  const shapes = [{ kind: 'circle', c: [0, 0], r: 50 }, { kind: 'circle', c: [60, 0], r: 50 }]
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const { rows, keep, trim } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: DEPTH_AT_LEAST(2), eps: 0.3 })
  filewrite({ rows, keep, trim }, '01-classify')
  for (const r of rows) console.log(`[01] seg ${r.id} mid [${r.mid.map(x => x.toFixed(0))}] cnt ${r.cnt1}/${r.cnt2} -> ${r.keep ? 'KEEP' : 'trim'}`)

  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  const rPost = await api.v1.sketch.postTrim({ id: skId })
  await snapshot('01-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const tree = rPost.structure?.tree
  const arcInfo = []
  for (const id of geo.arcs || []) {
    const p = await positions(api, id)
    arcInfo.push({ id, bulge: tree?.[id]?.members?.bulge?.value, start: p.startPos, end: p.endPos })
  }
  filewrite({ geo, arcInfo }, '01-result')
  console.log('[01] REALIZED: arcs', (geo.arcs || []).length, 'lines', geo.lines.length, 'circles', (geo.circles || []).length)
  for (const a of arcInfo) console.log(`[01] arc ${a.id} bulge ${a.bulge?.toFixed(3)} (${(4 * Math.atan(Math.abs(a.bulge)) * 180 / Math.PI).toFixed(0)}deg) ${JSON.stringify(a.start)}->${JSON.stringify(a.end)}`)

  const onXpts = v => Math.abs(Math.abs(v[1]) - 40) < 1e-3 && Math.abs(v[0] - 30) < 1e-3
  const checks = {
    twoArcs: (geo.arcs || []).length === 2 && geo.lines.length === 0,
    minorArcs: arcInfo.every(a => Math.abs(a.bulge) < 1),
    endpointsAtIntersections: arcInfo.every(a => onXpts(a.start) && onXpts(a.end)),
  }
  console.log('[01] CHECKS', JSON.stringify(checks))
  console.log('[01]', Object.values(checks).every(Boolean) ? 'PASS — prediction realized' : 'MISMATCH — see data')
  return { checks }
}
