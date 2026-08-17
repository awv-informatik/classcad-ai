// 04 — skew non-unit line: 0.4 cut proves true 2D chord lerp and that param0 == startPos.
// A=[10,20,0] B=[40,60,0], delta=[30,40,0], len 50. 0.4 -> [22,36,0], segA len 20.
import { makeSketch, line, positions, vecApprox, approx } from './_setup.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const A = [10, 20, 0], B = [40, 60, 0]
  const l = await line(api, skId, A, B)

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [0.4] }] })
  const segs = r.result[0].splittedCurves
  const pA = await positions(api, segs[0].id)
  const pB = await positions(api, segs[1].id)
  filewrite({ intervals: segs.map(s => s.interval), pA, pB }, '04-positions')
  console.log('[04] segA', JSON.stringify(segs[0].interval), JSON.stringify(pA.startPos), '->', JSON.stringify(pA.endPos))
  console.log('[04] segB', JSON.stringify(segs[1].interval), JSON.stringify(pB.startPos), '->', JSON.stringify(pB.endPos))

  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
  const cutFromStart = [22, 36, 0]  // A + 0.4*(B-A)
  const cutFromEnd = [28, 44, 0]    // B - 0.4*(B-A)  (would indicate param0==endPos)
  const param0IsStart = vecApprox(pA.endPos, cutFromStart)
  const checks = {
    twoSegments: segs.length === 2,
    cutAtChordLerpFromStart: param0IsStart,
    segALengthIs20: approx(dist(pA.startPos, pA.endPos), 20),
    segBLengthIs30: approx(dist(pB.startPos, pB.endPos), 30),
    endpointsPreserved: vecApprox(pA.startPos, A) && vecApprox(pB.endPos, B),
    intervals: JSON.stringify(segs.map(s => s.interval)) === JSON.stringify([[0, 0.4], [0.4, 1]]),
  }
  console.log('[04] param0 ==', param0IsStart ? 'startPos' : (vecApprox(pA.endPos, cutFromEnd) ? 'endPos(!)' : 'UNKNOWN'))
  console.log('[04] CHECKS', JSON.stringify(checks))
  console.log('[04]', Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL')
  await snapshot('skew-04')
  return { allPass: Object.values(checks).every(Boolean), checks }
}
