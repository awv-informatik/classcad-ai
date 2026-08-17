// 00-smoke — trim basics + staging-state probe: what happens to a segment the instant it is trimmed?
import { makeSketch, line, positions, containers, vecApprox } from './_setup.mjs'

async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const v = await line(api, skId, [50, 0, 0], [50, 100, 0])

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const hE = pre.result.find(e => e.sourceId === h)
  const allSegs = pre.result.flatMap(e => e.splittedCurves.map(s => s.id))
  const scBefore = containers(pre.structure?.tree).find(c => c.name === 'SplittedCurves')?.childCount
  const target = await segTouching(api, hE, [0, 50, 0]) // left overhang
  console.log('[00] all staged segs', JSON.stringify(allSegs), 'SplittedCurves childCount', scBefore, '| trimming', target)

  const rTrim = await api.v1.sketch.trim({ id: skId, curveIds: [target] })
  console.log('[00] trim result', JSON.stringify(rTrim.result), 'maxLevel', rTrim.maxLevel)
  // is the trimmed seg id dead immediately?
  const trimmedPos = await positions(api, target)
  const scAfter = containers(rTrim.structure?.tree).find(c => c.name === 'SplittedCurves')?.childCount
  // are the OTHER staged segs still alive?
  const othersAlive = []
  for (const id of allSegs) if (id !== target) othersAlive.push({ id, maxLevel: (await positions(api, id)).maxLevel })
  console.log('[00] trimmed seg getPositions maxLevel', trimmedPos.maxLevel, '(immediately dead?)', '| SplittedCurves childCount after', scAfter)
  console.log('[00] other segs alive:', JSON.stringify(othersAlive))

  const rPost = await api.v1.sketch.postTrim({ id: skId })
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ allSegs, scBefore, target, trimRes: rTrim.result, trimMax: rTrim.maxLevel, trimmedPosMax: trimmedPos.maxLevel, scAfter, othersAlive, postMax: rPost.maxLevel, geo }, 'smoke')
  console.log('[00] after postTrim lines', JSON.stringify(geo.lines), 'postMax', rPost.maxLevel)
  return { trimVoid: rTrim.result === null && rTrim.maxLevel <= 31, trimmedDead: trimmedPos.maxLevel >= 51, scDropped: scAfter < scBefore }
}
