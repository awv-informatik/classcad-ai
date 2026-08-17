// 05 — MIXED union: a rectangle + a circle poking out its right side -> union outline (lines + arc).
// Now that the renderer is fixed, the kept circle arc draws correctly.
import { makeSketch, line, circle, positions } from './_setup.mjs'
import { classify, UNION_OUTLINE } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const srcMap = {}
  // rectangle [0,0]-[80,40] as 4 lines
  const rp = [[0, 0], [80, 0], [80, 40], [0, 40]]
  for (let i = 0; i < 4; i++) { const a = rp[i], b = rp[(i + 1) % 4]; const id = await line(api, skId, [a[0], a[1], 0], [b[0], b[1], 0]); srcMap[id] = { type: 'line' } }
  const Cc = [80, 20], Cr = 25
  const C = await circle(api, skId, [Cc[0], Cc[1], 0], Cr) // pokes out the right edge
  srcMap[C] = { type: 'circle', c: Cc, r: Cr }
  await snapshot('05-before')

  const shapes = [{ kind: 'rect', a: [0, 0], b: [80, 40] }, { kind: 'circle', c: Cc, r: Cr }]
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const { rows, keep, trim } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: UNION_OUTLINE, eps: 0.3 })
  filewrite({ rows, keep, trim }, '05-classify')
  for (const r of rows) console.log(`[05] seg ${r.id} src ${r.sourceId} mid [${r.mid.map(x => x.toFixed(1))}] in1=${r.in1} in2=${r.in2} -> ${r.keep ? 'KEEP' : 'trim'}`)

  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('05-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ geo }, '05-result')
  console.log('[05] survivors: lines', geo.lines.length, 'arcs', (geo.arcs || []).length, 'circles', (geo.circles || []).length)
  // expect: 3 full rect sides (left/top/bottom) + the poking circle arc; the rect right edge and the circle's left arc trimmed
  const checks = {
    keptRectSidesAndArc: geo.lines.length >= 3 && (geo.arcs || []).length === 1 && (geo.circles || []).length === 0,
  }
  console.log('[05] CHECKS', JSON.stringify(checks))
  console.log('[05]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
