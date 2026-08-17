// 12 — only OPEN-interior (0<t<1) intersections cut. T-junction: through-line splits, touching line [0,1].
// Shared corner & collinear tip-to-tip: neither splits.
import { makeSketch, addSketch, line, positions, vecApprox } from './_setup.mjs'

const entryInfo = (r, src) => { const e = r.result.find(x => x.sourceId === src); return { segs: e.splittedCurves.length, iv: e.splittedCurves[0].interval, idReused: e.splittedCurves[0].id === src }; }

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // A: T-junction. L1 through-line; L2 endpoint sits on L1 interior at (50,0,0).
  const L1 = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const L2 = await line(api, skId, [50, 0, 0], [50, 80, 0])
  const rA = await api.v1.sketch.preTrim({ id: skId })
  const A = { L1: entryInfo(rA, L1), L2: entryInfo(rA, L2) }
  const l1cut = A.L1.segs === 2 ? (await positions(api, rA.result.find(e => e.sourceId === L1).splittedCurves[0].id)).endPos : null
  console.log('[12] A T-junction: L1', JSON.stringify(A.L1), 'cut', JSON.stringify(l1cut), '| L2', JSON.stringify(A.L2))

  // B: shared corner (both start at same point)
  const skB = await addSketch(api, partId, planeId, 'B')
  const B1 = await line(api, skB, [0, 0, 0], [100, 0, 0])
  const B2 = await line(api, skB, [0, 0, 0], [0, 100, 0])
  const rB = await api.v1.sketch.preTrim({ id: skB })
  const B = { B1: entryInfo(rB, B1), B2: entryInfo(rB, B2) }
  console.log('[12] B shared-corner:', JSON.stringify(B))

  // C: collinear tip-to-tip
  const skC = await addSketch(api, partId, planeId, 'C')
  const C1 = await line(api, skC, [0, 0, 0], [50, 0, 0])
  const C2 = await line(api, skC, [50, 0, 0], [100, 0, 0])
  const rC = await api.v1.sketch.preTrim({ id: skC })
  const C = { C1: entryInfo(rC, C1), C2: entryInfo(rC, C2) }
  console.log('[12] C collinear-tip:', JSON.stringify(C))

  filewrite({ A, l1cut, B, C }, '12-endpoint-vs-crossing')
  const unsplit = e => e.segs === 1 && JSON.stringify(e.iv) === '[0,1]' && e.idReused
  const checks = {
    A_throughSplits: A.L1.segs === 2 && vecApprox(l1cut, [50, 0, 0], 1e-6),
    A_touchingNotSplit: unsplit(A.L2),
    B_cornerNeitherSplit: unsplit(B.B1) && unsplit(B.B2),
    C_tipNeitherSplit: unsplit(C.C1) && unsplit(C.C2),
  }
  console.log('[12] CHECKS', JSON.stringify(checks))
  console.log('[12]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
