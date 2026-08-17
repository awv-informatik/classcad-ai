// 06 — DEEP INNER LOOP: 4 circles at the corners of a square, carve the region inside ALL FOUR. Discard everything.
//
// PREDICTION: circles r50 at (0,0),(50,0),(0,50),(50,50). The center (25,25) is inside all four (dist 35.4 < 50).
// The 4-fold-overlap region is a small curvilinear square (4 concave arcs) centred at (25,25). Realized outcome:
// exactly 4 arcs, tight around (25,25), no lines/circles. Rule: DEPTH_AT_LEAST(4).
import { makeSketch, circle, positions } from './_setup.mjs'
import { classify, DEPTH_AT_LEAST } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  console.log('[06] PREDICT: 4 arcs = curvilinear square (4-circle deep overlap) around (25,25); discard all else')
  const { skId } = await makeSketch(api)
  const centers = [[0, 0], [50, 0], [0, 50], [50, 50]], r = 50
  for (const c of centers) await circle(api, skId, [...c, 0], r)
  await snapshot('06-before')

  const shapes = centers.map(c => ({ kind: 'circle', c, r }))
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const total = pre.result.flatMap(e => e.splittedCurves).length
  const { keep, trim, rows } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: DEPTH_AT_LEAST(4), eps: 0.3 })
  console.log('[06] total segments', total, '| keep', keep.length, '| trim', trim.length)
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  const rPost = await api.v1.sketch.postTrim({ id: skId })
  await snapshot('06-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const arcInfo = []
  for (const id of geo.arcs || []) { const p = await positions(api, id); arcInfo.push({ id, start: p.startPos.map(x => +x.toFixed(1)), end: p.endPos.map(x => +x.toFixed(1)) }) }
  filewrite({ total, keep: keep.length, trim: trim.length, geo, arcInfo }, '06-result')
  console.log('[06] REALIZED: arcs', (geo.arcs || []).length, 'lines', geo.lines.length, 'circles', (geo.circles || []).length)
  console.log('[06] arc endpoints', JSON.stringify(arcInfo.map(a => [a.start, a.end])))
  const nearC = arcInfo.every(a => Math.hypot(a.start[0] - 25, a.start[1] - 25) < 25)
  const checks = {
    fourArcs: (geo.arcs || []).length === 4 && geo.lines.length === 0 && (geo.circles || []).length === 0,
    tight: nearC,
  }
  console.log('[06] CHECKS', JSON.stringify(checks))
  console.log('[06]', Object.values(checks).every(Boolean) ? 'PASS — prediction realized' : 'see data')
  return { checks }
}
