// 15 — preTrim twice without postTrim: silent overwrite; first batch seg ids DIE; SplittedCurves child count
// stays constant (not doubled); check for a stale NoneSplitted0 leak after postTrim.
import { makeSketch, line, positions, containers } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  await line(api, skId, [0, 0, 0], [100, 100, 0])
  await line(api, skId, [0, 100, 0], [100, 0, 0])

  const pre1 = await api.v1.sketch.preTrim({ id: skId })
  const ids1 = pre1.result.flatMap(e => e.splittedCurves.map(s => s.id))
  const sc1 = containers(pre1.structure?.tree).find(c => c.name === 'SplittedCurves')?.childCount

  const pre2 = await api.v1.sketch.preTrim({ id: skId })
  const ids2 = pre2.result.flatMap(e => e.splittedCurves.map(s => s.id))
  const sc2 = containers(pre2.structure?.tree).find(c => c.name === 'SplittedCurves')?.childCount

  // are pre1 seg ids now dead?
  const pre1Alive = []
  for (const id of ids1) pre1Alive.push((await positions(api, id)).maxLevel)

  const rPost = await api.v1.sketch.postTrim({ id: skId })
  const contsAfter = containers(rPost.structure?.tree).map(c => c.name)
  filewrite({ ids1, ids2, sc1, sc2, pre1Alive, pre2Max: pre2.maxLevel, contsAfter }, '15-twice')
  console.log('[15] pre2 maxLevel', pre2.maxLevel, '| ids1', JSON.stringify(ids1), 'ids2', JSON.stringify(ids2))
  console.log('[15] SplittedCurves childCount: pre1', sc1, 'pre2', sc2, '(constant?)')
  console.log('[15] pre1 seg getPositions maxLevels (expect 51 dead):', JSON.stringify(pre1Alive))
  console.log('[15] containers after postTrim:', JSON.stringify(contsAfter))

  const checks = {
    pre2Silent: pre2.maxLevel <= 31,
    freshIds: ids1.every(id => !ids2.includes(id)),
    pre1Dead: pre1Alive.every(m => m >= 51),
    childCountConstant: sc1 === sc2,
  }
  console.log('[15] CHECKS', JSON.stringify(checks))
  console.log('[15]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  console.log('[15] NoneSplitted0 leak?', contsAfter.some(n => /NoneSplitted0|SplittedCurves/.test(n)))
  return { checks, contsAfter }
}
