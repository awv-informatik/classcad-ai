// 03 — INNER LOOP from lines: two crossing rectangles (a plus). Carve the central overlap square, discard the arms.
//
// PREDICTION: R1 = [0,0]-[80,40] (wide), R2 = [20,-20]-[60,60] (tall). Their overlap is the rectangle [20,0]-[60,40].
// Realized outcome: 4 line segments forming exactly that central square; the 8 protruding "arm" segments discarded.
// Rule: DEPTH_AT_LEAST(2) over the two rects.
import { makeSketch, line, positions } from './_setup.mjs'
import { classify, DEPTH_AT_LEAST } from './_geo.mjs'

const rectLines = async (api, sk, a, b) => {
  const p = [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]]
  for (let i = 0; i < 4; i++) await line(api, sk, [p[i][0], p[i][1], 0], [p[(i + 1) % 4][0], p[(i + 1) % 4][1], 0])
}

export default async function (api, { snapshot, filewrite }) {
  console.log('[03] PREDICT: 4 lines forming the central square [20,0]-[60,40]; discard the 8 arm segments')
  const { skId } = await makeSketch(api)
  await rectLines(api, skId, [0, 0], [80, 40])
  await rectLines(api, skId, [20, -20], [60, 60])
  await snapshot('03-before')

  const shapes = [{ kind: 'rect', a: [0, 0], b: [80, 40] }, { kind: 'rect', a: [20, -20], b: [60, 60] }]
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const { keep, trim } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: DEPTH_AT_LEAST(2), eps: 0.3 })
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('03-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const survivors = []
  for (const id of geo.lines) { const p = await positions(api, id); survivors.push([p.startPos[0], p.startPos[1], p.endPos[0], p.endPos[1]]) }
  filewrite({ keep: keep.length, trim: trim.length, survivors }, '03-result')
  console.log('[03] REALIZED: lines', geo.lines.length, 'arcs', (geo.arcs || []).length, '| survivors', JSON.stringify(survivors))
  // every survivor endpoint must lie on the central square [20,0]-[60,40]
  const onSquare = v => v[0] >= 20 - 1e-6 && v[0] <= 60 + 1e-6 && v[1] >= -1e-6 && v[1] <= 40 + 1e-6
  const checks = {
    fourLines: geo.lines.length === 4 && (geo.arcs || []).length === 0,
    allOnCentralSquare: survivors.every(s => onSquare([s[0], s[1]]) && onSquare([s[2], s[3]])),
  }
  console.log('[03] CHECKS', JSON.stringify(checks))
  console.log('[03]', Object.values(checks).every(Boolean) ? 'PASS — prediction realized' : 'see data')
  return { checks }
}
