// 05 — INNER LOOP from a COMPLEX FIELD (grid + circle) via an arbitrary region predicate.
// Carve one designated inner cell, with a circular BITE out of one corner. Discard the whole rest of the field.
//
// PREDICTION: 3x3 mesh (grid lines at 0,30,60,90 on both axes) + circle center (60,60) r20. Carve the CENTER cell
// [30,60]x[30,60] MINUS the circle. The circle cuts the cell's top edge at (40,60) and right edge at (60,40).
// Realized outcome: a rounded cell = 4 line segments (full bottom, full left, top 30->40, right 30->40) + 1 arc
// (40,60)->(60,40). Region predicate: P in cell AND NOT in circle.
import { makeSketch, line, circle, positions } from './_setup.mjs'
import { classifyByRegion, inCircle } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  console.log('[05] PREDICT: rounded center cell = 4 lines + 1 arc; whole rest of the grid+circle field discarded')
  const { skId } = await makeSketch(api)
  for (const y of [0, 30, 60, 90]) await line(api, skId, [0, y, 0], [90, y, 0])
  for (const x of [0, 30, 60, 90]) await line(api, skId, [x, 0, 0], [x, 90, 0])
  await circle(api, skId, [60, 60, 0], 20)
  await snapshot('05-before')

  // region = the center cell minus the circular bite
  const inCell = P => P[0] >= 30 && P[0] <= 60 && P[1] >= 30 && P[1] <= 60
  const region = P => inCell(P) && !inCircle(P, [60, 60], 20)

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const total = pre.result.flatMap(e => e.splittedCurves).length
  const { keep, trim } = await classifyByRegion(api, pre.result, pre.structure?.tree, region, { eps: 0.4 })
  console.log('[05] total segments', total, '| keep', keep.length, '| trim', trim.length)
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('05-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const survivors = []
  for (const id of geo.lines) { const p = await positions(api, id); survivors.push([+p.startPos[0].toFixed(0), +p.startPos[1].toFixed(0), +p.endPos[0].toFixed(0), +p.endPos[1].toFixed(0)]) }
  filewrite({ total, keep: keep.length, trim: trim.length, geo, survivors }, '05-result')
  console.log('[05] REALIZED: lines', geo.lines.length, 'arcs', (geo.arcs || []).length, '| lines', JSON.stringify(survivors))
  // all survivor line endpoints must be within the closed cell box; exactly one arc
  const inBox = v => v[0] >= 30 - 1e-3 && v[0] <= 60 + 1e-3 && v[1] >= 30 - 1e-3 && v[1] <= 60 + 1e-3
  const checks = {
    oneArc: (geo.arcs || []).length === 1,
    fourLines: geo.lines.length === 4,
    allInCell: survivors.every(s => inBox([s[0], s[1]]) && inBox([s[2], s[3]])),
    noFullCircle: (geo.circles || []).length === 0,
  }
  console.log('[05] CHECKS', JSON.stringify(checks))
  console.log('[05]', Object.values(checks).every(Boolean) ? 'PASS — prediction realized' : 'see data')
  return { checks }
}
