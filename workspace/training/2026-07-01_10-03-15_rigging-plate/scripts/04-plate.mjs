// 04 — full plate: body + holes + all four fillets (topWaist R1.750, botWaist R1.375, right-neck R.625/R.438),
// one region trim, then sliver/orphan-point cleanup. region = inAnyBody ∧ ¬inAnyHole ∧ ¬inAnyFillet.
import { makeSketch, circle, obround, positions, cleanupSlivers } from './_setup.mjs'
import { M, bodyShapes, holeShapes, filletShapes, filletDisks } from './_model.mjs'
import { classifyByRegion, inAny } from './_geo.mjs'

async function dumpGeo(api, skId) {
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const out = { lines: [], arcs: [], circles: [] }
  for (const id of geo.lines) { const p = await positions(api, id); out.lines.push([p.startPos.slice(0, 2).map(n => +n.toFixed(2)), p.endPos.slice(0, 2).map(n => +n.toFixed(2))]) }
  for (const id of geo.arcs || []) { const p = await positions(api, id); out.arcs.push([p.startPos.slice(0, 2).map(n => +n.toFixed(2)), p.endPos.slice(0, 2).map(n => +n.toFixed(2))]) }
  for (const id of geo.circles || []) { const pts = (await api.v1.sketch.getPoints({ id })).result; const c = await positions(api, pts.centerId); out.circles.push(c.pos.slice(0, 2).map(n => +n.toFixed(2))) }
  return out
}

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api, { name: 'RiggingPlate' })
  await circle(api, skId, [...M.centerBoss.c, 0], M.centerBoss.rBoss)
  await circle(api, skId, [...M.topBoss.c, 0], M.topBoss.rBoss)
  await obround(api, skId, M.leftEnd.a, M.leftEnd.b, M.leftEnd.r)
  await obround(api, skId, M.rightLobe.near, M.rightLobe.far, M.rightLobe.r)
  await circle(api, skId, [...M.centerBoss.c, 0], M.centerBoss.rHole)
  await circle(api, skId, [...M.topBoss.c, 0], M.topBoss.rHole)
  await obround(api, skId, M.slot.a, M.slot.b, M.slot.r)
  for (const f of filletDisks()) await circle(api, skId, [f.c[0], f.c[1], 0], f.r)
  console.log('[04] fillets', JSON.stringify(filletDisks().map(f => [f.tag, f.c.map(x => +x.toFixed(2))])))
  await snapshot('04-before')

  const body = bodyShapes(), holes = holeShapes(), fillets = filletShapes()
  const region = P => inAny(body, P) && !inAny(holes, P) && !inAny(fillets, P)

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const total = pre.result.flatMap(e => e.splittedCurves).length
  const { keep, trim } = await classifyByRegion(api, pre.result, pre.structure?.tree, region, { eps: 0.06 })
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  const clean = await cleanupSlivers(api, skId, { minLen: 0.05 })
  await snapshot('04-after')

  const out = await dumpGeo(api, skId)
  filewrite({ total, keep: keep.length, trim: trim.length, clean, geo: out }, '04-plate')
  console.log('[04] total', total, 'keep', keep.length, 'trim', trim.length, '| cleaned', JSON.stringify(clean))
  console.log('[04] REALIZED lines', out.lines.length, 'arcs', out.arcs.length, 'circles', out.circles.length, JSON.stringify(out.circles))
  return { keep: keep.length, clean }
}
