// 08 — NoneSplitted0 leak: reproduce (preTrim x2 -> postTrim); does 2nd postTrim sweep it? harm/accumulate?
// other path (trim-then-re-preTrim)?
import { makeSketch, addSketch, line, positions, containers, vecApprox } from './_setup.mjs'

const names = tree => containers(tree).map(c => `${c.name}(${c.childCount})`).sort()
async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // 3.1 reproduce: preTrim x2 -> postTrim
  await line(api, skId, [0, 50, 0], [100, 50, 0]); await line(api, skId, [50, 0, 0], [50, 100, 0])
  await api.v1.sketch.preTrim({ id: skId })
  await api.v1.sketch.preTrim({ id: skId }) // no postTrim between
  const rP1 = await api.v1.sketch.postTrim({ id: skId })
  const afterLeak = names(rP1.structure?.tree)
  // 3.2 second postTrim
  const rP2 = await api.v1.sketch.postTrim({ id: skId })
  const afterSecond = names(rP2.structure?.tree)
  console.log('[08] 3.1 after leak cycle:', JSON.stringify(afterLeak))
  console.log('[08] 3.2 after 2nd postTrim:', JSON.stringify(afterSecond), '(swept?)')

  // 3.3 harm: fresh full cycle on the leaked sketch
  const v2 = await line(api, skId, [25, 0, 0], [25, 100, 0])
  const preH = await api.v1.sketch.preTrim({ id: skId })
  const anySeg = preH.result.flatMap(e => e.splittedCurves.map(s => s.id))[0]
  await api.v1.sketch.trim({ id: skId, curveIds: [anySeg] })
  const rP3 = await api.v1.sketch.postTrim({ id: skId })
  const afterHarm = names(rP3.structure?.tree)
  console.log('[08] 3.3 fresh cycle on leaked sketch -> containers:', JSON.stringify(afterHarm))

  // 3.5 other path: trim then re-preTrim (mid-workflow) then postTrim
  const skB = await addSketch(api, partId, planeId, 'B')
  const hB = await line(api, skB, [0, 50, 0], [100, 50, 0]); await line(api, skB, [50, 0, 0], [50, 100, 0])
  const preB = await api.v1.sketch.preTrim({ id: skB })
  const segB = await segTouching(api, preB.result.find(e => e.sourceId === hB), [0, 50, 0])
  await api.v1.sketch.trim({ id: skB, curveIds: [segB] })
  await api.v1.sketch.preTrim({ id: skB }) // re-preTrim mid-workflow (after a trim)
  const rPB = await api.v1.sketch.postTrim({ id: skB })
  const otherPath = names(rPB.structure?.tree)
  console.log('[08] 3.5 trim-then-re-preTrim path -> containers:', JSON.stringify(otherPath))

  filewrite({ afterLeak, afterSecond, afterHarm, otherPath }, '08-leak')
  const leakName = afterLeak.find(n => /^NoneSplitted0/.test(n))
  const checks = {
    reproducedLeak: !!leakName,
    secondPostTrimBehavior: true, // report only
    freshCycleWorks: rP3.maxLevel <= 31,
  }
  console.log('[08] leak repro:', leakName || 'NONE', '| 2nd-postTrim swept?', !afterSecond.some(n => /NoneSplitted0/.test(n)))
  console.log('[08] CHECKS', JSON.stringify(checks))
  return { checks, afterLeak, afterSecond, afterHarm, otherPath }
}
