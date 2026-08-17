// 04 — INNER LOOP (mixed): a square and a circle overlapping at a corner. Carve the overlap, discard outer.
//
// PREDICTION: square [0,0]-[80,80], circle center (80,80) r50. The overlap (inside both) is bounded by the
// circle's inner arc (from (30,80) to (80,30)) plus the top-edge segment (30..80 @ y=80) and right-edge segment
// (30..80 @ x=80). Realized outcome: 1 arc + 2 lines forming a "quarter-pie with a rounded hypotenuse". DEPTH_AT_LEAST(2).
import { makeSketch, line, circle, positions } from './_setup.mjs'
import { classify, DEPTH_AT_LEAST } from './_geo.mjs'

const rectLines = async (api, sk, a, b) => { const p = [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]]; for (let i = 0; i < 4; i++) await line(api, sk, [p[i][0], p[i][1], 0], [p[(i + 1) % 4][0], p[(i + 1) % 4][1], 0]) }

export default async function (api, { snapshot, filewrite }) {
  console.log('[04] PREDICT: 1 arc + 2 lines = the square-circle corner overlap (arc (30,80)->(80,30) + edge stubs)')
  const { skId } = await makeSketch(api)
  await rectLines(api, skId, [0, 0], [80, 80])
  await circle(api, skId, [80, 80, 0], 50)
  await snapshot('04-before')

  const shapes = [{ kind: 'rect', a: [0, 0], b: [80, 80] }, { kind: 'circle', c: [80, 80], r: 50 }]
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const { keep, trim } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: DEPTH_AT_LEAST(2), eps: 0.3 })
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('04-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ keep: keep.length, trim: trim.length, geo }, '04-result')
  console.log('[04] REALIZED: lines', geo.lines.length, 'arcs', (geo.arcs || []).length, 'circles', (geo.circles || []).length)
  const checks = { oneArc: (geo.arcs || []).length === 1, twoLines: geo.lines.length === 2, noCircle: (geo.circles || []).length === 0 }
  console.log('[04] CHECKS', JSON.stringify(checks))
  console.log('[04]', Object.values(checks).every(Boolean) ? 'PASS — prediction realized' : 'see data')
  return { checks }
}
