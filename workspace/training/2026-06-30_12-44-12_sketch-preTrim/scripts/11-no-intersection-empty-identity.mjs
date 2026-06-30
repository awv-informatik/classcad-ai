// 11 — no-intersection -> single [0,1] with id===sourceId (preTrim REUSES unsplit id, unlike splitCurve);
// empty sketch -> result:[] (Array, not VOID); identity rule id===sourceId && [0,1] => not split.
import { makeSketch, addSketch, line, positions, containers, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // A: two parallel non-crossing lines
  const P1 = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const P2 = await line(api, skId, [0, 20, 0], [100, 20, 0])
  const rA = await api.v1.sketch.preTrim({ id: skId })
  const A = rA.result.map(e => ({ src: e.sourceId, segs: e.splittedCurves.length, iv: e.splittedCurves[0].interval, idReused: e.splittedCurves[0].id === e.sourceId }))
  console.log('[11] A parallel:', JSON.stringify(A))

  // B: single isolated line
  const skB = await addSketch(api, partId, planeId, 'B')
  const Lb = await line(api, skB, [0, 0, 0], [100, 0, 0])
  const rB = await api.v1.sketch.preTrim({ id: skB })
  const B = { len: rB.result.length, segs: rB.result[0]?.splittedCurves.length, iv: rB.result[0]?.splittedCurves[0]?.interval, idReused: rB.result[0]?.splittedCurves[0]?.id === Lb }
  console.log('[11] B single:', JSON.stringify(B))

  // C: empty sketch
  const skC = await addSketch(api, partId, planeId, 'C')
  const rC = await api.v1.sketch.preTrim({ id: skC })
  const C = { isArray: Array.isArray(rC.result), len: rC.result?.length, maxLevel: rC.maxLevel, containers: containers(rC.structure?.tree).map(c => c.name) }
  console.log('[11] C empty:', JSON.stringify(C))

  filewrite({ A, B, C, rA: rA.result, rB: rB.result, rC: rC.result }, '11-degenerate')
  const checks = {
    A_bothUnsplitIdReused: A.every(e => e.segs === 1 && JSON.stringify(e.iv) === '[0,1]' && e.idReused),
    B_singleUnsplitIdReused: B.len === 1 && B.segs === 1 && JSON.stringify(B.iv) === '[0,1]' && B.idReused,
    C_emptyArrayNotVoid: C.isArray && C.len === 0 && C.maxLevel <= 31,
  }
  console.log('[11] CHECKS', JSON.stringify(checks))
  console.log('[11]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks, C_containersOnEmpty: C.containers }
}
