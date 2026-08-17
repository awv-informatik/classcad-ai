// 01 — two overlapping circles -> union outline. Validate the boundary-test classifier + arc-midpoint mapping.
// Expect: keep the two OUTER arcs, trim the two INNER arcs.
import { makeSketch, circle, positions } from './_setup.mjs'
import { classify, UNION_OUTLINE } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const C1 = await circle(api, skId, [0, 0, 0], 50)
  const C2 = await circle(api, skId, [60, 0, 0], 50)
  await snapshot('01-before') // two full overlapping circles

  const srcMap = { [C1]: { type: 'circle', c: [0, 0], r: 50 }, [C2]: { type: 'circle', c: [60, 0], r: 50 } }
  const shapes = [{ kind: 'circle', c: [0, 0], r: 50 }, { kind: 'circle', c: [60, 0], r: 50 }]

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const { rows, keep, trim } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: UNION_OUTLINE })
  filewrite({ rows, keep, trim }, '01-classify')
  for (const r of rows) console.log(`[01] seg ${r.id} src ${r.sourceId} mid [${r.mid.map(x => x.toFixed(1))}] in1=${r.in1} in2=${r.in2} -> ${r.keep ? 'KEEP' : 'trim'}`)

  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('01-after') // union outline

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  // verify survivors are 2 arcs; check a point that should be on the union boundary vs interior
  console.log('[01] survivors: arcs', (geo.arcs || []).length, 'circles', (geo.circles || []).length, 'lines', (geo.lines || []).length)
  filewrite({ geo, keptCount: keep.length, trimCount: trim.length }, '01-result')

  const checks = {
    fourSegments: rows.length === 4,
    keptTwo: keep.length === 2,
    trimmedTwo: trim.length === 2,
    survivorsAreTwoArcs: (geo.arcs || []).length === 2 && (geo.circles || []).length === 0,
    // the outer-arc midpoints (-50,0) and (110,0) should be classified KEEP; inner (50,0)/(10,0) trim
    outerKept: rows.filter(r => r.keep).every(r => Math.abs(r.mid[0]) > 40 || Math.abs(r.mid[0] - 110) < 5),
  }
  console.log('[01] CHECKS', JSON.stringify(checks))
  console.log('[01]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
