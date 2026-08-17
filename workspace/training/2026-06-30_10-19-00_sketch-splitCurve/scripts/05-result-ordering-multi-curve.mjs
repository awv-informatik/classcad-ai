// 05 — multi-curve call: result.length===splits.length, result[i].sourceId===splits[i].geomId,
// order tracks INPUT order (not internal id order). Two sketches on ONE part (regime C);
// only one part.create per run is allowed (see 05c/05d).
import { makeSketch, addSketch, line, summarizeSplit } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)
  const L1 = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const L2 = await line(api, skId, [0, 10, 0], [0, 60, 0])
  const rA = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: L1, values: [0.5] }, { geomId: L2, values: [0.25, 0.75] }] })
  filewrite({ A: rA.result }, '05-resultA')
  console.log('[05] A', JSON.stringify(summarizeSplit(rA)))

  // second sketch on the SAME part, swapped input order
  const sk2 = await addSketch(api, partId, planeId, 'S2')
  const M1 = await line(api, sk2, [0, 0, 0], [100, 0, 0])
  const M2 = await line(api, sk2, [0, 10, 0], [0, 60, 0])
  const rB = await api.v1.sketch.splitCurve({ id: sk2, splits: [{ geomId: M2, values: [0.25, 0.75] }, { geomId: M1, values: [0.5] }] })
  filewrite({ B: rB.result }, '05-resultB')
  console.log('[05] B', JSON.stringify(summarizeSplit(rB)))

  const checks = {
    A_len2: rA.result.length === 2,
    A_order: rA.result[0].sourceId === L1 && rA.result[1].sourceId === L2,
    A_counts: rA.result[0].splittedCurves.length === 2 && rA.result[1].splittedCurves.length === 3,
    B_isArray: Array.isArray(rB.result),
    B_order_tracks_input: rB.result?.[0]?.sourceId === M2 && rB.result?.[1]?.sourceId === M1,
    B_counts: rB.result?.[0]?.splittedCurves.length === 3 && rB.result?.[1]?.splittedCurves.length === 2,
  }
  console.log('[05] CHECKS', JSON.stringify(checks))
  console.log('[05]', Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL')
  return { allPass: Object.values(checks).every(Boolean), checks }
}
