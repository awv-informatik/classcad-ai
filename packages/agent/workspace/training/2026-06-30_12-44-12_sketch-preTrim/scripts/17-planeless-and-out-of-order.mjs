// 17 — (A) preTrim + restore round-trip is solver-independent (planeless sketch);
// (B) postTrim/trim with nothing staged are harmless no-ops (mL31).
import { makeSketch, addPlanelessSketch, line, positions, firstError, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { partId, skId } = await makeSketch(api) // skId used for B

  // A: PLANELESS sketch, 2 crossed lines
  const skPL = await addPlanelessSketch(api, partId, 'planeless')
  const A1 = await line(api, skPL, [0, 0, 0], [100, 100, 0])
  const A2 = await line(api, skPL, [0, 100, 0], [100, 0, 0])
  const pre = await api.v1.sketch.preTrim({ id: skPL })
  const cut = await positions(api, pre.result.find(e => e.sourceId === A1).splittedCurves[0].id)
  const rPost = await api.v1.sketch.postTrim({ id: skPL })
  const geoPL = (await api.v1.sketch.getGeometry({ id: skPL })).result.lines
  const A = { preMax: pre.maxLevel, cut: cut.endPos, postMax: rPost.maxLevel, after: geoPL, originalsPreserved: geoPL.includes(A1) && geoPL.includes(A2) }
  console.log('[17] A planeless: preMax', A.preMax, 'cut', JSON.stringify(A.cut), 'postMax', A.postMax, 'originalsPreserved', A.originalsPreserved)

  // B: out-of-order on the planeId sketch (nothing staged)
  const B1 = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const geoBefore = (await api.v1.sketch.getGeometry({ id: skId })).result.lines
  const rPostB = await api.v1.sketch.postTrim({ id: skId })           // nothing staged
  const rTrimB = await api.v1.sketch.trim({ id: skId, curveIds: [B1] }) // nothing staged
  const geoAfter = (await api.v1.sketch.getGeometry({ id: skId })).result.lines
  const B = { postMax: rPostB.maxLevel, postErr: firstError(rPostB), trimMax: rTrimB.maxLevel, trimErr: firstError(rTrimB), unchanged: JSON.stringify(geoBefore) === JSON.stringify(geoAfter) }
  console.log('[17] B out-of-order: postTrim max', B.postMax, 'trim max', B.trimMax, '| geometry unchanged', B.unchanged)

  filewrite({ A, B }, '17-planeless-outoforder')
  const checks = {
    A_planelessSplits: A.preMax <= 31 && vecApprox(A.cut, [50, 50, 0], 1e-6),
    A_planelessRestore: A.postMax <= 31 && A.originalsPreserved,
    B_postTrimNoOp: B.postMax <= 31,
    B_trimNoOp: B.trimMax <= 31 && B.unchanged,
  }
  console.log('[17] CHECKS', JSON.stringify(checks))
  console.log('[17]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
