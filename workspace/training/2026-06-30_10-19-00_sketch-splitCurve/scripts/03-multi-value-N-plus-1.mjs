// 03 — N values -> N+1 segments with contiguous intervals covering [0,1] (open line). Spatial cross-check.
import { makeSketch, line, positions, vecApprox } from './_setup.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [0.25, 0.75] }] })
  const segs = r.result[0].splittedCurves
  const pos = []
  for (const s of segs) pos.push({ id: s.id, interval: s.interval, ...(await positions(api, s.id)) })
  filewrite({ intervals: segs.map(s => s.interval), pos }, '03-positions')
  for (const p of pos) console.log('[03] seg', p.id, JSON.stringify(p.interval), JSON.stringify(p.startPos), '->', JSON.stringify(p.endPos))

  const ivs = segs.map(s => s.interval)
  const widthSum = ivs.reduce((a, iv) => a + (iv[1] - iv[0]), 0)
  const checks = {
    threeSegments: segs.length === 3,
    intervalsExact: JSON.stringify(ivs) === JSON.stringify([[0, 0.25], [0.25, 0.75], [0.75, 1]]),
    firstT0_zero: ivs[0][0] === 0,
    lastT1_one: ivs[2][1] === 1,
    chained: ivs[0][1] === ivs[1][0] && ivs[1][1] === ivs[2][0],
    widthsSumTo1: Math.abs(widthSum - 1) <= 1e-9,
    vertexAt25: vecApprox(pos[0].endPos, [25, 0, 0]) && vecApprox(pos[1].startPos, [25, 0, 0]),
    vertexAt75: vecApprox(pos[1].endPos, [75, 0, 0]) && vecApprox(pos[2].startPos, [75, 0, 0]),
    middleSpans25to75: vecApprox(pos[1].startPos, [25, 0, 0]) && vecApprox(pos[1].endPos, [75, 0, 0]),
  }
  console.log('[03] CHECKS', JSON.stringify(checks))
  console.log('[03]', Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL')
  await snapshot('split-3seg')
  return { allPass: Object.values(checks).every(Boolean), checks }
}
