// 06 — where the NAIVE rule ("trim if midpoint inside another shape") FAILS but the boundary test wins.
// Two overlapping circles + a horizontal line crossing through and overhanging both ends.
// Correct union outline = 2 arcs, the whole line trimmed. Naive keeps the line's OVERHANG stubs (outside all shapes).
import { makeSketch, line, circle, positions } from './_setup.mjs'
import { classify, classifyNaive, UNION_OUTLINE } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)
  const build = async (sk) => {
    const srcMap = {}
    const C1 = await circle(api, sk, [0, 0, 0], 50); srcMap[C1] = { type: 'circle', c: [0, 0], r: 50 }
    const C2 = await circle(api, sk, [60, 0, 0], 50); srcMap[C2] = { type: 'circle', c: [60, 0], r: 50 }
    const L = await line(api, sk, [-90, 0, 0], [150, 0, 0]); srcMap[L] = { type: 'line' } // crosses both, overhangs both ends
    return srcMap
  }
  const shapes = [{ kind: 'circle', c: [0, 0], r: 50 }, { kind: 'circle', c: [60, 0], r: 50 }]

  // NAIVE run
  const srcMapA = await build(api, skId)
  await snapshot('06-before')
  const preA = await api.v1.sketch.preTrim({ id: skId })
  const naive = await classifyNaive(api, preA.result, preA.structure?.tree, shapes)
  await api.v1.sketch.trim({ id: skId, curveIds: naive.trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('06-naive')
  const geoNaive = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[06] NAIVE survivors: lines', geoNaive.lines.length, 'arcs', (geoNaive.arcs || []).length, '(stubs => lines>0 is the failure)')

  // BOUNDARY run (fresh sketch)
  const { addSketch } = await import('./_setup.mjs')
  const sk2 = await addSketch(api, partId, planeId, 'boundary')
  const srcMapB = await build(api, sk2)
  const preB = await api.v1.sketch.preTrim({ id: sk2 })
  const bnd = await classify(api, preB.result, preB.structure?.tree, shapes, { keepRule: UNION_OUTLINE, eps: 0.3 })
  await api.v1.sketch.trim({ id: sk2, curveIds: bnd.trim })
  await api.v1.sketch.postTrim({ id: sk2 })
  await snapshot('06-boundary')
  const geoBnd = (await api.v1.sketch.getGeometry({ id: sk2 })).result
  console.log('[06] BOUNDARY survivors: lines', geoBnd.lines.length, 'arcs', (geoBnd.arcs || []).length, '(clean => lines=0, arcs=2)')

  filewrite({ naive: { lines: geoNaive.lines.length, arcs: (geoNaive.arcs || []).length }, boundary: { lines: geoBnd.lines.length, arcs: (geoBnd.arcs || []).length } }, '06-compare')
  const checks = {
    naiveLeavesStubs: geoNaive.lines.length > 0,
    boundaryClean: geoBnd.lines.length === 0 && (geoBnd.arcs || []).length === 2,
  }
  console.log('[06] CHECKS', JSON.stringify(checks))
  console.log('[06]', Object.values(checks).every(Boolean) ? 'PASS (naive fails, boundary wins)' : 'see data')
  return { checks }
}
