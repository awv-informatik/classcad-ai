// 04 — tangent (single contact): open line still splits at (0,50,0) into 2 segs; circle stays ONE part
// with a length-1 wrapped interval (NOT [0,1]); the circle part is a closed circle (getPositions mL51).
import { makeSketch, line, circle, positions, centerPos, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const c = await circle(api, skId, [0, 0, 0], 50)
  const l = await line(api, skId, [-100, 50, 0], [100, 50, 0]) // y=50 tangent at (0,50,0)

  const r = await api.v1.sketch.preTrim({ id: skId })
  const lineE = r.result.find(e => e.sourceId === l)
  const circE = r.result.find(e => e.sourceId === c)

  const lp = []
  for (const s of lineE.splittedCurves) { const p = await positions(api, s.id); lp.push({ iv: s.interval, start: p.startPos, end: p.endPos }) }
  // circle part: getPositions should fail (closed circle) -> use getPoints->centerId
  const circPart = circE.splittedCurves[0]
  const circGetPos = await positions(api, circPart.id)
  const cen = await centerPos(api, circPart.id)
  filewrite({ lineEntry: lineE, lp, circEntry: circE, circGetPosMaxLevel: circGetPos.maxLevel, center: cen }, '04-tangent')
  console.log('[04] line segs', lineE.splittedCurves.length, JSON.stringify(lp.map(p => p.iv)))
  console.log('[04] cut vertex', JSON.stringify(lp[0]?.end))
  console.log('[04] circle parts', circE.splittedCurves.length, 'interval', JSON.stringify(circPart.interval))
  console.log('[04] circle part getPositions maxLevel', circGetPos.maxLevel, '(expect 51); centerId', cen.centerId, 'pos', JSON.stringify(cen.pos))

  const span = circPart.interval ? circPart.interval[1] - circPart.interval[0] : null
  const checks = {
    lineTwoSegs: lineE.splittedCurves.length === 2,
    lineCutAtTangent: vecApprox(lp[0]?.end, [0, 50, 0], 1e-4),
    circleOnePart: circE.splittedCurves.length === 1,
    circleIntervalNot01: JSON.stringify(circPart.interval) !== '[0,1]',
    circleIntervalSpan1: span != null && Math.abs(span - 1) < 1e-6,
    circlePartIsClosed_getPosFails: circGetPos.maxLevel >= 51,
    centerAtOrigin: vecApprox(cen.pos, [0, 0, 0], 1e-6),
  }
  console.log('[04] CHECKS', JSON.stringify(checks))
  console.log('[04]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks, circleInterval: circPart.interval }
}
