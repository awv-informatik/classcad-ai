// 16 — circle [0.25,0.75]: 2 arcs? resolve [0,1]-vs-2pi domain via angle math; record wrap-interval encoding.
import { makeSketch, positions, summarizeSplit, firstError } from './_setup.mjs'

const ang = (x, y) => (Math.atan2(y, x) * 180 / Math.PI + 360) % 360

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 50 })).result

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: circle, values: [0.25, 0.75] }] })
  console.log('[16]', JSON.stringify(summarizeSplit(r)), 'err', JSON.stringify(firstError(r)))

  const segData = []
  if (Array.isArray(r.result)) {
    for (const s of r.result[0].splittedCurves) {
      const p = await positions(api, s.id)
      segData.push({
        id: s.id, interval: s.interval,
        startPos: p.startPos, endPos: p.endPos,
        startAngleDeg: p.startPos ? ang(p.startPos[0], p.startPos[1]) : null,
        endAngleDeg: p.endPos ? ang(p.endPos[0], p.endPos[1]) : null,
        radius: p.startPos ? Math.hypot(p.startPos[0], p.startPos[1]) : null,
      })
    }
  }
  filewrite({ result: r.result, segData }, '16-circle2')
  for (const s of segData) console.log('[16] seg iv', JSON.stringify(s.interval), 'startAng', s.startAngleDeg, 'endAng', s.endAngleDeg, 'r', s.radius)
  // If domain is [0,1]: 0.25 and 0.75 are quarter/three-quarter turns from the seam -> 90deg apart between cuts.
  console.log('[16] interval encodings:', JSON.stringify(segData.map(s => s.interval)))
  console.log('[16] nSegs', segData.length)
  return { nSegs: segData.length, intervals: segData.map(s => s.interval) }
}
