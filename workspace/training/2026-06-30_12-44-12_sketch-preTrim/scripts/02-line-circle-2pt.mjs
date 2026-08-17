// 02 — open line crossing a circle twice -> 3 line segs (N+1) cut at (-50,0,0)/(50,0,0);
// circle -> 2 arcs (N, not N+1). getPositions works on the resulting arc seg ids.
import { makeSketch, line, circle, positions, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const c = await circle(api, skId, [0, 0, 0], 50)
  const l = await line(api, skId, [-100, 0, 0], [100, 0, 0])
  console.log('[02] circle', c, 'line', l)

  const r = await api.v1.sketch.preTrim({ id: skId })
  const lineE = r.result.find(e => e.sourceId === l)
  const circE = r.result.find(e => e.sourceId === c)

  const linePos = []
  for (const s of lineE.splittedCurves) { const p = await positions(api, s.id); linePos.push({ iv: s.interval, start: p.startPos, end: p.endPos }) }
  const arcPos = []
  for (const s of circE.splittedCurves) { const p = await positions(api, s.id); arcPos.push({ iv: s.interval, maxLevel: p.maxLevel, start: p.startPos, end: p.endPos }) }
  filewrite({ lineEntry: lineE, circEntry: circE, linePos, arcPos }, '02-line-circle')
  console.log('[02] line segs', lineE.splittedCurves.length, JSON.stringify(linePos.map(p => p.iv)))
  for (const p of linePos) console.log('[02]   line seg', JSON.stringify(p.iv), JSON.stringify(p.start), '->', JSON.stringify(p.end))
  console.log('[02] circle segs', circE.splittedCurves.length, 'arc getPositions maxLevels', JSON.stringify(arcPos.map(p => p.maxLevel)))
  for (const p of arcPos) console.log('[02]   arc seg', JSON.stringify(p.iv), JSON.stringify(p.start), '->', JSON.stringify(p.end))

  const cuts = [linePos[0].end, linePos[1].end] // the two interior cut vertices on the line
  const checks = {
    lineThreeSegs: lineE.splittedCurves.length === 3,
    circleTwoArcs: circE.splittedCurves.length === 2,
    cutAtMinus50: vecApprox(cuts[0], [-50, 0, 0], 1e-6),
    cutAtPlus50: vecApprox(cuts[1], [50, 0, 0], 1e-6),
    arcsQueryable: arcPos.every(p => p.maxLevel <= 31),
  }
  console.log('[02] CHECKS', JSON.stringify(checks))
  console.log('[02]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
