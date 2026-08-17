// 05 — CORRECTED LAYOUT (per user): top boss raised, .750 horizontal from center boss, clear gap, joined by a web.
// Union-outline trim only (no waist fillets yet) to isolate the vertical re-layout. region = body ∧ ¬holes.
import { makeSketch, circle, obround, positions, cleanupSlivers } from './_setup.mjs'
import { M, bodyShapes, holeShapes } from './_model.mjs'
import { classifyByRegion, inAny } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api, { name: 'RiggingPlate' })
  await circle(api, skId, [...M.centerBoss.c, 0], M.centerBoss.rBoss)
  await circle(api, skId, [...M.topBoss.c, 0], M.topBoss.rBoss)
  await obround(api, skId, M.topBoss.c, M.centerBoss.c, M.web.r)   // web
  await obround(api, skId, M.leftEnd.a, M.leftEnd.b, M.leftEnd.r)
  await obround(api, skId, M.rightLobe.near, M.rightLobe.far, M.rightLobe.r)
  await circle(api, skId, [...M.centerBoss.c, 0], M.centerBoss.rHole)
  await circle(api, skId, [...M.topBoss.c, 0], M.topBoss.rHole)
  await obround(api, skId, M.slot.a, M.slot.b, M.slot.r)
  await snapshot('05-before')

  const body = bodyShapes(), holes = holeShapes()
  const region = P => inAny(body, P) && !inAny(holes, P)
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const total = pre.result.flatMap(e => e.splittedCurves).length
  const { keep, trim } = await classifyByRegion(api, pre.result, pre.structure?.tree, region, { eps: 0.06 })
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  const clean = await cleanupSlivers(api, skId, { minLen: 0.05 })
  await snapshot('05-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ total, keep: keep.length, clean, counts: { lines: geo.lines.length, arcs: (geo.arcs || []).length, circles: (geo.circles || []).length } }, '05-union2')
  console.log('[05] total', total, 'keep', keep.length, '| cleaned', JSON.stringify(clean), '| lines', geo.lines.length, 'arcs', (geo.arcs || []).length, 'circles', (geo.circles || []).length)
  return { keep: keep.length }
}
