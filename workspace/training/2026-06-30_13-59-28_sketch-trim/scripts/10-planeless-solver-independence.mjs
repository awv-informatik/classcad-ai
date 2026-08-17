// 10 — trim works on a planeless (solver-dead) sketch for a line seg AND an arc seg in one call.
import { makeSketch, addPlanelessSketch, line, circle, positions, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { partId } = await makeSketch(api)
  const pl = await addPlanelessSketch(api, partId, 'pl')
  const C = await circle(api, pl, [50, 50, 0], 40)
  const Lc = await line(api, pl, [0, 50, 0], [100, 50, 0]) // cuts circle -> 2 arcs + 3 line segs
  const hh = await line(api, pl, [0, 80, 0], [100, 80, 0]) // a plain horizontal crossing nothing relevant
  const vv = await line(api, pl, [20, 0, 0], [20, 100, 0]) // crosses hh and Lc

  const pre = await api.v1.sketch.preTrim({ id: pl })
  const lineSeg = pre.result.find(e => e.sourceId === hh)?.splittedCurves[0]?.id // a line segment
  const arcSeg = pre.result.find(e => e.sourceId === C)?.splittedCurves[0]?.id   // an arc segment
  console.log('[10] preTrim max', pre.maxLevel, '| lineSeg', lineSeg, 'arcSeg', arcSeg)

  const rTrim = await api.v1.sketch.trim({ id: pl, curveIds: [lineSeg, arcSeg] })
  console.log('[10] trim(line+arc on planeless) result', JSON.stringify(rTrim.result), 'max', rTrim.maxLevel)
  const rPost = await api.v1.sketch.postTrim({ id: pl })
  const geo = (await api.v1.sketch.getGeometry({ id: pl })).result
  filewrite({ preMax: pre.maxLevel, trimMax: rTrim.maxLevel, trimRes: rTrim.result, postMax: rPost.maxLevel, geo }, '10-planeless')
  console.log('[10] postTrim max', rPost.maxLevel, '| geo lines', geo.lines.length, 'arcs', (geo.arcs || []).length)

  const checks = {
    preTrimOk: pre.maxLevel <= 31,
    trimVoid: rTrim.result === null && rTrim.maxLevel <= 31,
    postOk: rPost.maxLevel <= 31,
  }
  console.log('[10] CHECKS', JSON.stringify(checks))
  console.log('[10]', Object.values(checks).every(Boolean) ? 'PASS (trim solver-independent for line+arc)' : 'see data')
  return { checks }
}
