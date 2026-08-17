// 02 — INNER LOOP: the triple-overlap center of 3 circles. Discard all outer + pairwise arcs.
//
// PREDICTION: 3 circles r50 with centers on an equilateral triangle of side 50 (A(0,0), B(50,0), C(25,43.3)).
// The region inside ALL THREE is a Reuleaux-like curvilinear triangle bounded by exactly 3 arcs (one per circle,
// each the arc facing the centroid). Realized outcome: exactly 3 surviving arcs forming a small rounded triangle
// centred near the centroid (~(25,14.4)); no lines, no full circles. Rule: DEPTH_AT_LEAST(3).
import { makeSketch, circle, positions } from './_setup.mjs'
import { classify, DEPTH_AT_LEAST } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  console.log('[02] PREDICT: 3 arcs forming a curvilinear (Reuleaux-like) triangle around the centroid; discard everything else')
  const { skId } = await makeSketch(api)
  const A = [0, 0], B = [50, 0], C = [25, 43.30], r = 50
  await circle(api, skId, [...A, 0], r)
  await circle(api, skId, [...B, 0], r)
  await circle(api, skId, [...C, 0], r)
  await snapshot('02-before')

  const shapes = [{ kind: 'circle', c: A, r }, { kind: 'circle', c: B, r }, { kind: 'circle', c: C, r }]
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const total = pre.result.flatMap(e => e.splittedCurves).length
  const { rows, keep, trim } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: DEPTH_AT_LEAST(3), eps: 0.3 })
  filewrite({ total, keep, trim, rows }, '02-classify')
  console.log('[02] total segments', total, '| keep', keep.length, '| trim', trim.length)
  for (const r of rows.filter(r => r.keep)) console.log(`[02] KEEP seg ${r.id} mid [${r.mid.map(x => x.toFixed(0))}] cnt ${r.cnt1}/${r.cnt2}`)

  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  const rPost = await api.v1.sketch.postTrim({ id: skId })
  await snapshot('02-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const tree = rPost.structure?.tree
  const arcInfo = []
  for (const id of geo.arcs || []) { const p = await positions(api, id); arcInfo.push({ id, bulge: tree?.[id]?.members?.bulge?.value, start: p.startPos, end: p.endPos }) }
  filewrite({ geo, arcInfo }, '02-result')
  console.log('[02] REALIZED: arcs', (geo.arcs || []).length, 'lines', geo.lines.length, 'circles', (geo.circles || []).length)
  // arcs should form a closed loop: each arc's endpoints shared with another arc's endpoint, all near the centroid
  const centroid = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3]
  const nearCentroid = arcInfo.every(a => Math.hypot(a.start[0] - centroid[0], a.start[1] - centroid[1]) < 40)
  const checks = {
    threeArcs: (geo.arcs || []).length === 3 && geo.lines.length === 0 && (geo.circles || []).length === 0,
    tightAroundCentroid: nearCentroid,
  }
  console.log('[02] centroid', centroid.map(x => x.toFixed(1)), '| arc endpoints:', JSON.stringify(arcInfo.map(a => [a.start.map(x => +x.toFixed(1)), a.end.map(x => +x.toFixed(1))])))
  console.log('[02] CHECKS', JSON.stringify(checks))
  console.log('[02]', Object.values(checks).every(Boolean) ? 'PASS — prediction realized' : 'see data')
  return { checks }
}
