// 02 — after postTrim the sketch is genuinely LIVE: all ids resolve, add-line works, a 2nd full cycle re-stages
// then re-cleans with NO container accumulation.
import { makeSketch, line, positions, containers, vecApprox } from './_setup.mjs'

async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}
const contNames = tree => containers(tree).map(c => c.name).sort()

async function cycle(api, skId, h, v) {
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const oh = await segTouching(api, pre.result.find(e => e.sourceId === h), [0, 50, 0])
  await api.v1.sketch.trim({ id: skId, curveIds: [oh] })
  return api.v1.sketch.postTrim({ id: skId })
}

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const v = await line(api, skId, [50, 0, 0], [50, 100, 0])
  await cycle(api, skId, h, v)

  // (a) all getGeometry ids resolve (0 dead)
  const geo1 = (await api.v1.sketch.getGeometry({ id: skId })).result
  let dead = 0
  for (const id of geo1.lines) if ((await positions(api, id)).maxLevel >= 51) dead++
  console.log('[02] after cycle1: lines', JSON.stringify(geo1.lines), 'dead ids', dead)

  // (b) add a new line
  const newId = await line(api, skId, [10, 10, 0], [40, 40, 0])
  const geo2 = (await api.v1.sketch.getGeometry({ id: skId })).result
  const newPos = await positions(api, newId)
  const addOk = geo2.lines.length === geo1.lines.length + 1 && vecApprox(newPos.startPos, [10, 10, 0]) && vecApprox(newPos.endPos, [40, 40, 0])
  console.log('[02] add-line: count', geo1.lines.length, '->', geo2.lines.length, 'endpoints ok', addOk)

  // (c) a 2nd full cycle: add a crossing line, preTrim/trim/postTrim
  const v2 = await line(api, skId, [25, 0, 0], [25, 100, 0]) // crosses the survivor h + the new diagonal
  const pre2 = await api.v1.sketch.preTrim({ id: skId })
  const stagedAgain = contNames(pre2.structure?.tree).some(n => n === 'SplittedCurves')
  const anySeg = pre2.result.flatMap(e => e.splittedCurves.map(s => s.id))[0]
  await api.v1.sketch.trim({ id: skId, curveIds: [anySeg] })
  const rPost2 = await api.v1.sketch.postTrim({ id: skId })
  const contsFinal = contNames(rPost2.structure?.tree)
  console.log('[02] cycle2: re-staged?', stagedAgain, '| containers after cycle2', JSON.stringify(contsFinal))

  filewrite({ dead, addOk, stagedAgain, contsFinal, geo1lines: geo1.lines, geo2lines: geo2.lines }, '02-editable')
  const checks = {
    noDeadIds: dead === 0,
    addLineWorks: addOk,
    cycle2ReStaged: stagedAgain,
    noContainerAccumulation: contsFinal.length === 0,
  }
  console.log('[02] CHECKS', JSON.stringify(checks))
  console.log('[02]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
