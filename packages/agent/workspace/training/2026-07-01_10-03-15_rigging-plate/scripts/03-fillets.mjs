// 03 — add the two big concave WAIST fillets (R1.750 top, R1.375 bottom) as subtractive disks, then trim the
// whole part in one region pass:  region = inAnyBody ∧ ¬inAnyHole ∧ ¬inAnyFillet.
// Fillet disks are tangent (external) to their two neighbour bosses → their arcs become the smooth valley outline.
import { makeSketch, circle, obround, positions } from './_setup.mjs'
import { M, bodyShapes, holeShapes, filletShapes, filletDisks } from './_model.mjs'
import { classifyByRegion, inAny } from './_geo.mjs'

async function dumpGeo(api, skId) {
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const out = { lines: [], arcs: [], circles: (geo.circles || []).length }
  for (const id of geo.lines) { const p = await positions(api, id); out.lines.push([p.startPos.slice(0, 2).map(n => +n.toFixed(2)), p.endPos.slice(0, 2).map(n => +n.toFixed(2))]) }
  for (const id of geo.arcs || []) { const p = await positions(api, id); out.arcs.push([p.startPos.slice(0, 2).map(n => +n.toFixed(2)), p.endPos.slice(0, 2).map(n => +n.toFixed(2))]) }
  return { geo, out }
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
  console.log('[03] fillet centers', JSON.stringify(filletDisks().map(f => [f.tag, f.c.map(x => +x.toFixed(2))])))
  await snapshot('03-before')

  const body = bodyShapes(), holes = holeShapes(), fillets = filletShapes()
  const region = P => inAny(body, P) && !inAny(holes, P) && !inAny(fillets, P)

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const total = pre.result.flatMap(e => e.splittedCurves).length
  const { keep, trim } = await classifyByRegion(api, pre.result, pre.structure?.tree, region, { eps: 0.06 })
  console.log('[03] total', total, '| keep', keep.length, '| trim', trim.length)
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('03-after')

  const { out } = await dumpGeo(api, skId)
  filewrite({ total, keep: keep.length, trim: trim.length, fillets: filletDisks().map(f => ({ tag: f.tag, c: f.c })), geo: out }, '03-fillets')
  console.log('[03] REALIZED lines', out.lines.length, 'arcs', out.arcs.length, 'circles', out.circles)
  return { total, keep: keep.length }
}
