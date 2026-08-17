// 01 — normal cycle: both SplittedCurves AND NoneSplitted fully REMOVED by name; no *0 leak; census delta 0.
import { makeSketch, line, positions, containers, vecApprox } from './_setup.mjs'

async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}
const names = tree => containers(tree).map(c => c.name).sort()

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const v = await line(api, skId, [50, 0, 0], [50, 100, 0])
  const baseline = names((await api.v1.sketch.getGeometry({ id: skId })).structure?.tree)

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const staged = names(pre.structure?.tree)
  const oh1 = await segTouching(api, pre.result.find(e => e.sourceId === h), [0, 50, 0])
  const oh2 = await segTouching(api, pre.result.find(e => e.sourceId === v), [50, 0, 0])
  await api.v1.sketch.trim({ id: skId, curveIds: [oh1, oh2] })
  const rPost = await api.v1.sketch.postTrim({ id: skId })
  const after = containers(rPost.structure?.tree)
  const afterNames = after.map(c => c.name).sort()
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ baseline, staged, afterNames, afterFull: after, geoLines: geo.lines }, '01-cleanup')
  console.log('[01] baseline containers', JSON.stringify(baseline))
  console.log('[01] staged containers', JSON.stringify(staged))
  console.log('[01] postTrim max', rPost.maxLevel, '| containers AFTER', JSON.stringify(afterNames))

  const checks = {
    postVoid: rPost.result === null && rPost.maxLevel <= 31,
    splittedGone: !afterNames.includes('SplittedCurves'),
    noneSplittedGone: !afterNames.includes('NoneSplitted'),
    noStarZeroLeak: !afterNames.some(n => /^(SplittedCurves|NoneSplitted)\d+$/.test(n)),
    censusDelta0: JSON.stringify(afterNames) === JSON.stringify(baseline),
    cleanL: geo.lines.length === 2,
  }
  console.log('[01] CHECKS', JSON.stringify(checks))
  console.log('[01]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
