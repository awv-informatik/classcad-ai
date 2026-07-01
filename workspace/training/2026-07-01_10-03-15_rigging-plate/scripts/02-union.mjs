// 02 — BASE SILHOUETTE via union-outline trim (NO fillets yet). Draw the connected blob (bosses + lobes) with
// interior holes, then keep the boundary of  (inAnyBody ∧ ¬inAnyHole).  This shows the plate with SHARP waists
// (cusps where circles cross); the next step smooths those with fillet disks. Before/after snapshots.
import { makeSketch, circle, obround, positions } from './_setup.mjs'
import { M, bodyShapes, holeShapes } from './_model.mjs'
import { classifyByRegion, inAny } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api, { name: 'RiggingPlate' })

  // additive bodies
  await circle(api, skId, [...M.centerBoss.c, 0], M.centerBoss.rBoss)
  await circle(api, skId, [...M.topBoss.c, 0], M.topBoss.rBoss)
  await obround(api, skId, M.leftEnd.a, M.leftEnd.b, M.leftEnd.r)
  await obround(api, skId, M.rightLobe.near, M.rightLobe.far, M.rightLobe.r)
  // interior holes
  await circle(api, skId, [...M.centerBoss.c, 0], M.centerBoss.rHole)
  await circle(api, skId, [...M.topBoss.c, 0], M.topBoss.rHole)
  await obround(api, skId, M.slot.a, M.slot.b, M.slot.r)
  await snapshot('02-before')

  const body = bodyShapes(), holes = holeShapes()
  const region = P => inAny(body, P) && !inAny(holes, P)

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const total = pre.result.flatMap(e => e.splittedCurves).length
  const { keep, trim } = await classifyByRegion(api, pre.result, pre.structure?.tree, region, { eps: 0.08 })
  console.log('[02] total segments', total, '| keep', keep.length, '| trim', trim.length)
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('02-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ total, keep: keep.length, trim: trim.length, geo }, '02-union')
  console.log('[02] REALIZED lines', geo.lines.length, 'arcs', (geo.arcs || []).length, 'circles', (geo.circles || []).length)
  return { total, keep: keep.length }
}
