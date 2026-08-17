// 07 — STRESS: a mesh grid + two circles poking out opposite sides, all crossing. Extract the union outline of
// {bounding rect, circleL, circleR} with the boundary test. Interior grid lines + circle inner arcs get trimmed.
import { makeSketch, line, circle, positions } from './_setup.mjs'
import { classify, UNION_OUTLINE } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  // 2x2 mesh spanning 0..90
  for (const y of [0, 45, 90]) await line(api, skId, [0, y, 0], [90, y, 0])
  for (const x of [0, 45, 90]) await line(api, skId, [x, 0, 0], [x, 90, 0])
  // circles poking out the left and right mid-edges
  const CL = [0, 45], CR = [90, 45], r = 30
  await circle(api, skId, [CL[0], CL[1], 0], r)
  await circle(api, skId, [CR[0], CR[1], 0], r)
  await snapshot('07-before')

  const shapes = [
    { kind: 'rect', a: [0, 0], b: [90, 90] },
    { kind: 'circle', c: CL, r },
    { kind: 'circle', c: CR, r },
  ]
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const totalSegs = pre.result.flatMap(e => e.splittedCurves).length
  const { keep, trim, rows } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: UNION_OUTLINE, eps: 0.4 })
  filewrite({ totalSegs, keep: keep.length, trim: trim.length, rows }, '07-classify')
  console.log('[07] total segments', totalSegs, '| keep', keep.length, '| trim', trim.length)

  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('07-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ geo }, '07-result')
  console.log('[07] survivors: lines', geo.lines.length, 'arcs', (geo.arcs || []).length, 'circles', (geo.circles || []).length)
  // sanity: no full circles remain, some arcs (the two bumps) + some perimeter lines survive, interior gone
  const checks = {
    noFullCircles: (geo.circles || []).length === 0,
    hasArcs: (geo.arcs || []).length >= 2,
    hasPerimeterLines: geo.lines.length >= 4,
    trimmedInterior: trim.length > keep.length, // most segments are interior grid + inner arcs
  }
  console.log('[07] CHECKS', JSON.stringify(checks))
  console.log('[07]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
