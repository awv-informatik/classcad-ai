// 03a — updateGeometry toggle + construction-as-constraint-reference (no solids; isolate from extrusion).
import { makeSketch, addSketch, line, circle } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const out = {}
  const { partId, skId, planeId } = await makeSketch(api, { name: 'ConstrRef' })
  const S = api.v1.sketch

  // A) updateGeometry toggles isConstruction both ways
  const tl = await line(api, skId, [0, 0, 0], [30, 0, 0])
  const before = (await S.getObjectInfo({ id: tl })).result?.isConstruction
  await S.updateGeometry({ id: skId, lines: [{ id: tl, isConstruction: true }] })
  const afterOn = (await S.getObjectInfo({ id: tl })).result?.isConstruction
  await S.updateGeometry({ id: skId, lines: [{ id: tl, isConstruction: false }] })
  const afterOff = (await S.getObjectInfo({ id: tl })).result?.isConstruction
  out.toggle = { before, afterOn, afterOff }

  // B) construction line used as a TANGENT reference — solver must move the circle onto tangency
  const skT = await addSketch(api, partId, planeId, 'Tangent')
  const axis = (await S.line({ id: skT, startPos: [0, -50, 0], endPos: [0, 50, 0], isConstruction: true })).result
  const cir = await circle(api, skT, [30, 0, 0], 10)
  await S.constraint([{ id: skT, type: 'TANGENT', geomIds: [cir, axis] }])
  const cpts = (await S.getPoints({ id: cir })).result
  const cc = (await S.getPositions({ id: cpts.centerId })).result
  out.tangentToConstruction = { center: [cc.pos.x, cc.pos.y], enforced: Math.abs(Math.abs(cc.pos.x) - 10) < 1e-3 }

  filewrite(out, '03a-toggle-ref')
  console.log('[03a] toggle', JSON.stringify(out.toggle))
  console.log('[03a] TANGENT to construction axis → center', JSON.stringify(out.tangentToConstruction.center), 'enforced:', out.tangentToConstruction.enforced)
  return out
}
