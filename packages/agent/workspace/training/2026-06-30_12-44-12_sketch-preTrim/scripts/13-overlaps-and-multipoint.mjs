// 13 — overlaps (silent hazards) + N curves through one point (clean, no slivers).
import { makeSketch, addSketch, line, positions, vecApprox } from './_setup.mjs'

const info = (r, src) => { const e = r.result.find(x => x.sourceId === src); return { segs: e.splittedCurves.length, ivs: e.splittedCurves.map(s => s.interval) }; }

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // A: two identical fully-overlapping lines
  const A1 = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const A2 = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const rA = await api.v1.sketch.preTrim({ id: skId })
  const A = { A1: info(rA, A1), A2: info(rA, A2) }
  console.log('[13] A identical overlap:', JSON.stringify(A), '(both [0,1] = undetected hazard)')

  // B: partial collinear overlap [40,60]
  const skB = await addSketch(api, partId, planeId, 'B')
  const B1 = await line(api, skB, [0, 0, 0], [60, 0, 0])
  const B2 = await line(api, skB, [40, 0, 0], [100, 0, 0])
  const rB = await api.v1.sketch.preTrim({ id: skB })
  const B = { B1: info(rB, B1), B2: info(rB, B2) }
  console.log('[13] B partial overlap:', JSON.stringify(B))

  // C: 3 lines through (50,50,0)
  const skC = await addSketch(api, partId, planeId, 'C')
  const C1 = await line(api, skC, [0, 50, 0], [100, 50, 0])
  const C2 = await line(api, skC, [50, 0, 0], [50, 100, 0])
  const C3 = await line(api, skC, [0, 0, 0], [100, 100, 0])
  const rC = await api.v1.sketch.preTrim({ id: skC })
  const C = [C1, C2, C3].map(s => info(rC, s).segs)
  // sliver detector: any zero-length segment among all parts
  let slivers = 0
  for (const e of rC.result) for (const s of e.splittedCurves) { const p = await positions(api, s.id); if (p.startPos && p.endPos && vecApprox(p.startPos, p.endPos, 1e-9)) slivers++ }
  console.log('[13] C 3-through-point segCounts', JSON.stringify(C), 'slivers', slivers)

  // D: 4 lines (asterisk) through one point
  const skD = await addSketch(api, partId, planeId, 'D')
  const D1 = await line(api, skD, [0, 50, 0], [100, 50, 0])
  const D2 = await line(api, skD, [50, 0, 0], [50, 100, 0])
  const D3 = await line(api, skD, [0, 0, 0], [100, 100, 0])
  const D4 = await line(api, skD, [0, 100, 0], [100, 0, 0])
  const rD = await api.v1.sketch.preTrim({ id: skD })
  const D = [D1, D2, D3, D4].map(s => info(rD, s).segs)
  console.log('[13] D 4-through-point segCounts', JSON.stringify(D))

  filewrite({ A, B, C, slivers, D }, '13-overlaps-multipoint')
  const checks = {
    A_identicalUndetected: JSON.stringify(A.A1.ivs) === '[[0,1]]' && JSON.stringify(A.A2.ivs) === '[[0,1]]',
    B_partialEachSplit: B.B1.segs === 2 && B.B2.segs === 2,
    C_eachTwo_noSlivers: C.every(n => n === 2) && slivers === 0,
    D_eachTwo: D.every(n => n === 2),
  }
  console.log('[13] CHECKS', JSON.stringify(checks))
  console.log('[13]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks, B_intervals: B }
}
