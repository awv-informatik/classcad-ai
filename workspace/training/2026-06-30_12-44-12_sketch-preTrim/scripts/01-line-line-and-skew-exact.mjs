// 01 — auto-split lands on the EXACT analytic intersection: axis-symmetric cross (50,50,0) + skew cross (40,20,0).
import { makeSketch, addSketch, line, positions, vecApprox } from './_setup.mjs'

async function crossCheck(api, skId, a1, a2, b1, b2, expect) {
  const L1 = await line(api, skId, a1, a2)
  const L2 = await line(api, skId, b1, b2)
  const r = await api.v1.sketch.preTrim({ id: skId })
  const e1 = r.result.find(e => e.sourceId === L1)
  const e2 = r.result.find(e => e.sourceId === L2)
  const v1 = await positions(api, e1.splittedCurves[0].id) // first seg endPos = cut vertex
  const v2 = await positions(api, e2.splittedCurves[0].id)
  return {
    nSegs: [e1.splittedCurves.length, e2.splittedCurves.length],
    intervals: [e1.splittedCurves[0].interval, e2.splittedCurves[0].interval],
    cut1: v1.endPos, cut2: v2.endPos,
    hit: vecApprox(v1.endPos, expect, 1e-9) && vecApprox(v2.endPos, expect, 1e-9),
  }
}

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)
  const A = await crossCheck(api, skId, [0, 0, 0], [100, 100, 0], [0, 100, 0], [100, 0, 0], [50, 50, 0])
  console.log('[01] A cross@(50,50):', JSON.stringify(A))

  const skB = await addSketch(api, partId, planeId, 'B')
  const B = await crossCheck(api, skB, [0, 0, 0], [80, 40, 0], [0, 40, 0], [80, 0, 0], [40, 20, 0])
  console.log('[01] B skew@(40,20):', JSON.stringify(B))

  filewrite({ A, B }, '01-crosses')
  console.log('[01]', A.hit && B.hit ? 'PASS (exact intersection finding, 1e-9)' : 'FAIL — see data')
  return { A, B }
}
