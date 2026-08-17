// 15 — circle, single value [0.25]: closed-curve segment count (N vs N+1) + DISCOVER t=0 seam numerically.
import { makeSketch, positions, summarizeSplit, firstError } from './_setup.mjs'

const ang = (x, y) => (Math.atan2(y, x) * 180 / Math.PI + 360) % 360

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 50 })).result
  console.log('[15] circle id', circle)
  const geoBefore = (await api.v1.sketch.getGeometry({ id: skId })).result

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: circle, values: [0.25] }] })
  console.log('[15]', JSON.stringify(summarizeSplit(r)), 'err', JSON.stringify(firstError(r)))
  const geoAfter = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[15] geo before', JSON.stringify(geoBefore), 'after', JSON.stringify(geoAfter))

  const segData = []
  if (Array.isArray(r.result)) {
    for (const s of r.result[0].splittedCurves) {
      const p = await positions(api, s.id)
      const sp = p.startPos, ep = p.endPos
      segData.push({
        id: s.id, interval: s.interval,
        startPos: sp, endPos: ep,
        startRadius: sp ? Math.hypot(sp[0], sp[1]) : null,
        startAngleDeg: sp ? ang(sp[0], sp[1]) : null,
        endAngleDeg: ep ? ang(ep[0], ep[1]) : null,
      })
    }
  }
  filewrite({ result: r.result, geoBefore, geoAfter, segData }, '15-circle')
  for (const s of segData) console.log('[15] seg', s.id, 'iv', JSON.stringify(s.interval), 'r', s.startRadius, 'startAng', s.startAngleDeg, 'endAng', s.endAngleDeg)
  console.log('[15] SEAM (first arc start angle, deg):', segData[0]?.startAngleDeg)
  await snapshot('circle-split-025')
  return { nSegs: Array.isArray(r.result) ? r.result[0].splittedCurves.length : null, seamDeg: segData[0]?.startAngleDeg }
}
