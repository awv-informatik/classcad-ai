// 10 — contiguous kept segments coalesce into ONE curve with a NEW id. Line chain (3 segs) + arc chain.
import { makeSketch, addSketch, line, positions, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // Fixture A: long H crossed by 2 verticals -> 3 contiguous H segments, keep ALL
  const h = await line(api, skId, [0, 0, 0], [100, 0, 0])
  await line(api, skId, [30, -20, 0], [30, 20, 0]); await line(api, skId, [70, -20, 0], [70, 20, 0])
  const preA = await api.v1.sketch.preTrim({ id: skId })
  const hSegs = preA.result.find(e => e.sourceId === h).splittedCurves.length
  await api.v1.sketch.postTrim({ id: skId }) // no trim -> keep all 3
  const geoA = (await api.v1.sketch.getGeometry({ id: skId })).result
  // H-derived survivor: the horizontal line spanning y=0
  let hSurv = null
  for (const id of geoA.lines) { const p = await positions(api, id); if (Math.abs(p.startPos[1]) < 1e-6 && Math.abs(p.endPos[1]) < 1e-6) hSurv = { id, ...p } }
  const A = { hSegs, hLinesAfter: geoA.lines.filter(Boolean).length, coalescedId: hSurv?.id, spans0to100: hSurv && vecApprox([Math.min(hSurv.startPos[0], hSurv.endPos[0]), 0, 0], [0, 0, 0]) && vecApprox([Math.max(hSurv.startPos[0], hSurv.endPos[0]), 0, 0], [100, 0, 0]), newId: hSurv && hSurv.id !== h }
  console.log('[10] A: H split into', hSegs, 'segs; kept all; H survivor id', hSurv?.id, '(orig', h, ') spans 0..100?', A.spans0to100)

  // Fixture B: top semicircle crossed by 2 verticals -> 3 contiguous arc segments, keep ALL
  const skB = await addSketch(api, partId, planeId, 'B')
  const arc = (await api.v1.sketch.arcByCenter({ id: skB, startPos: [100, 0, 0], endPos: [0, 0, 0], centerPos: [50, 0, 0], isClockwise: false })).result
  await line(api, skB, [30, -10, 0], [30, 60, 0]); await line(api, skB, [70, -10, 0], [70, 60, 0])
  const preB = await api.v1.sketch.preTrim({ id: skB })
  const arcSegs = preB.result.find(e => e.sourceId === arc)?.splittedCurves.length
  await api.v1.sketch.postTrim({ id: skB }) // keep all
  const geoB = (await api.v1.sketch.getGeometry({ id: skB })).result
  const B = { arcSegs, arcsAfter: (geoB.arcs || []).length }
  console.log('[10] B: arc split into', arcSegs, 'segs; kept all; arcs after postTrim', B.arcsAfter)

  filewrite({ A, B }, '10-coalesce')
  const checks = {
    A_lineCoalescedToOne: hSurv != null && A.spans0to100 && A.newId,
    B_arcCoalescedToOne: B.arcsAfter === 1,
  }
  console.log('[10] CHECKS', JSON.stringify(checks))
  console.log('[10]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
