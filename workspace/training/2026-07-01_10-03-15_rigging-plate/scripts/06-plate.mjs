// 06 — full plate, corrected layout: raised top boss + web + 2 waist fillets (R1.750 top, R1.375 bottom).
// region = inAnyBody ∧ ¬inAnyHole ∧ ¬inAnyFillet, then line-sliver + orphan-point cleanup.
import { makeSketch, circle, obround, positions, cleanupSlivers } from './_setup.mjs'
import { M, bodyShapes, holeShapes, filletShapes, filletDisks } from './_model.mjs'
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
  for (const f of filletDisks()) await circle(api, skId, [f.c[0], f.c[1], 0], f.r)
  console.log('[06] fillets', JSON.stringify(filletDisks().map(f => [f.tag, f.c.map(x => +x.toFixed(2))])))
  await snapshot('06-before')

  const body = bodyShapes(), holes = holeShapes(), fillets = filletShapes()
  const region = P => inAny(body, P) && !inAny(holes, P) && !inAny(fillets, P)
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const total = pre.result.flatMap(e => e.splittedCurves).length
  const { keep, trim } = await classifyByRegion(api, pre.result, pre.structure?.tree, region, { eps: 0.06 })
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  const clean = await cleanupSlivers(api, skId, { minLen: 0.05 })
  await snapshot('06-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ total, keep: keep.length, clean, counts: { lines: geo.lines.length, arcs: (geo.arcs || []).length, circles: (geo.circles || []).length } }, '06-plate')
  console.log('[06] total', total, 'keep', keep.length, '| cleaned', JSON.stringify(clean), '| lines', geo.lines.length, 'arcs', (geo.arcs || []).length, 'circles', (geo.circles || []).length)
  return { keep: keep.length }
}
