// 17 — open quarter arc split at [0.5]: 2 sub-arcs, cut at angular midpoint (45deg -> [35.355,35.355,0]). N+1 holds for open non-linear.
import { makeSketch, positions, summarizeSplit, firstError, vecApprox } from './_setup.mjs'

const ang = (x, y) => (Math.atan2(y, x) * 180 / Math.PI + 360) % 360

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  // quarter arc, center origin, radius 50, from +X to +Y, CCW
  const arc = (await api.v1.sketch.arcByCenter({ id: skId, startPos: [50, 0, 0], endPos: [0, 50, 0], centerPos: [0, 0, 0], isClockwise: false })).result
  console.log('[17] arc id', arc)
  const preP = await positions(api, arc)
  console.log('[17] arc pre start', JSON.stringify(preP.startPos), 'end', JSON.stringify(preP.endPos))

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: arc, values: [0.5] }] })
  console.log('[17]', JSON.stringify(summarizeSplit(r)), 'err', JSON.stringify(firstError(r)))

  const segData = []
  if (Array.isArray(r.result)) {
    for (const s of r.result[0].splittedCurves) {
      const p = await positions(api, s.id)
      segData.push({ id: s.id, interval: s.interval, startPos: p.startPos, endPos: p.endPos })
    }
  }
  filewrite({ preP, result: r.result, segData }, '17-arc')
  for (const s of segData) console.log('[17] seg iv', JSON.stringify(s.interval), JSON.stringify(s.startPos), '->', JSON.stringify(s.endPos))

  const mid = [50 * Math.cos(Math.PI / 4), 50 * Math.sin(Math.PI / 4), 0] // [35.355,35.355,0]
  const checks = Array.isArray(r.result) ? {
    twoSegments: segData.length === 2,
    intervals: JSON.stringify(segData.map(s => s.interval)) === JSON.stringify([[0, 0.5], [0.5, 1]]),
    cutAt45deg: vecApprox(segData[0]?.endPos, mid, 1e-4) && vecApprox(segData[1]?.startPos, mid, 1e-4),
    endpointsPreserved: vecApprox(segData[0]?.startPos, [50, 0, 0], 1e-4) && vecApprox(segData[1]?.endPos, [0, 50, 0], 1e-4),
    radiusPreserved: segData.every(s => Math.abs(Math.hypot(s.endPos[0], s.endPos[1]) - 50) < 1e-4),
  } : { error: true }
  console.log('[17] CHECKS', JSON.stringify(checks))
  console.log('[17]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  await snapshot('arc-split')
  return { checks }
}
