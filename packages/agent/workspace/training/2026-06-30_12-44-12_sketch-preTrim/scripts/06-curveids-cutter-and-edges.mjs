// 06 — curveIds edges: (A) excluded curve is NOT a cutter; (B) single-id -> no split; (C) empty [] == ALL (trap).
import { makeSketch, addSketch, line, positions, vecApprox, summarizeSplit } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // A: H y=50, V x=50 (cross at 50,50). D crosses H at (20,50) and V at (50,80). curveIds=[H,V].
  const H = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const V = await line(api, skId, [50, 0, 0], [50, 100, 0])
  const D = await line(api, skId, [10, 40, 0], [60, 90, 0]) // slope 1, y=x+30
  const rA = await api.v1.sketch.preTrim({ id: skId, curveIds: [H, V] })
  const hE = rA.result.find(e => e.sourceId === H)
  const hCut = await positions(api, hE.splittedCurves[0].id)
  const A = { len: rA.result.length, hSegs: hE.splittedCurves.length, hCut: hCut.endPos }
  console.log('[06] A subset[H,V] exclude D:', JSON.stringify(A), '| D not a cutter => H has 2 segs cut only at (50,50)')

  // B: single line, curveIds=[L1] -> no split
  const skB = await addSketch(api, partId, planeId, 'B')
  const Lb = await line(api, skB, [0, 0, 0], [100, 0, 0])
  const rB = await api.v1.sketch.preTrim({ id: skB, curveIds: [Lb] })
  const B = { len: rB.result.length, segs: rB.result[0]?.splittedCurves.length, interval: rB.result[0]?.splittedCurves[0]?.interval, idReused: rB.result[0]?.splittedCurves[0]?.id === Lb }
  console.log('[06] B single curveIds:', JSON.stringify(B))

  // C: 2 crossing lines, curveIds=[] -> behaves as ALL (both split)
  const skC = await addSketch(api, partId, planeId, 'C')
  const C1 = await line(api, skC, [0, 0, 0], [100, 100, 0])
  const C2 = await line(api, skC, [0, 100, 0], [100, 0, 0])
  const rC = await api.v1.sketch.preTrim({ id: skC, curveIds: [] })
  const C = { isArray: Array.isArray(rC.result), len: rC.result?.length, segCounts: rC.result?.map(e => e.splittedCurves.length) }
  console.log('[06] C empty-array curveIds:', JSON.stringify(C), JSON.stringify(summarizeSplit(rC)))

  filewrite({ A, B, C, rA: rA.result, rB: rB.result, rC: rC.result }, '06-edges')
  const checks = {
    A_excludedNotCutter: A.hSegs === 2 && vecApprox(A.hCut, [50, 50, 0], 1e-6) && A.len === 2,
    B_singleNoSplit: B.len === 1 && B.segs === 1 && JSON.stringify(B.interval) === '[0,1]' && B.idReused,
    C_emptyMeansAll: C.isArray && C.len === 2 && C.segCounts.every(n => n === 2),
  }
  console.log('[06] CHECKS', JSON.stringify(checks))
  console.log('[06]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
