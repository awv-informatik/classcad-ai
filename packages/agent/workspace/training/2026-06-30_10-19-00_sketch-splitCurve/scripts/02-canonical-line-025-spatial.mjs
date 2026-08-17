// 02 — spatial proof: 0.25 cut on a 0..100 line lands at world [25,0,0]. Three cross-checks.
import { makeSketch, line, positions, vecApprox } from './_setup.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])

  const pre = await positions(api, l) // lock param origin
  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [0.25] }] })
  const segs = r.result[0].splittedCurves
  const pA = await positions(api, segs[0].id)
  const pB = await positions(api, segs[1].id)
  filewrite({ pre, intervals: segs.map(s => s.interval), pA, pB }, '02-positions')
  console.log('[02] pre', JSON.stringify(pre.startPos), JSON.stringify(pre.endPos))
  console.log('[02] segA', JSON.stringify(segs[0].interval), JSON.stringify(pA.startPos), '->', JSON.stringify(pA.endPos))
  console.log('[02] segB', JSON.stringify(segs[1].interval), JSON.stringify(pB.startPos), '->', JSON.stringify(pB.endPos))

  // lerp(start,end,t)
  const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t)
  const cut = lerp(pre.startPos, pre.endPos, 0.25)
  const checks = {
    cutAnalytic_25_0_0: vecApprox(pA.endPos, [25, 0, 0]),
    sharedVertex: vecApprox(pA.endPos, pB.startPos),
    cutEqualsLerp: vecApprox(pA.endPos, cut),
    intervalT1Times100: Math.abs(segs[0].interval[1] * 100 - 25) <= 1e-6,
    endpointsPreserved: vecApprox(pA.startPos, [0, 0, 0]) && vecApprox(pB.endPos, [100, 0, 0]),
    intervalsContiguous: segs[0].interval[1] === segs[1].interval[0] && segs[0].interval[0] === 0 && segs[1].interval[1] === 1,
  }
  console.log('[02] CHECKS', JSON.stringify(checks))
  console.log('[02]', Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL')
  await snapshot('split-025')
  return { allPass: Object.values(checks).every(Boolean), checks }
}
