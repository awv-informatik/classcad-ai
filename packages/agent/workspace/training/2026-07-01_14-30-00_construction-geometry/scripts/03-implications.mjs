// 03 — IMPLICATIONS of construction geometry:
//   A) updateGeometry toggles isConstruction on existing geometry (both directions)
//   B) construction geometry IS usable as a constraint reference (TANGENT to a construction line is enforced) — its purpose
//   C) construction geometry can NOT be extruded (part.extrusion rejects it); a normal profile extrudes fine
import { makeSketch, addSketch, line, circle } from './_setup.mjs'

const err = r => (r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message?.slice(0, 120) }))
const rectLines = async (api, sk, a, b, isC = false) => {
  const p = [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]], ids = []
  for (let i = 0; i < 4; i++) ids.push((await api.v1.sketch.line({ id: sk, startPos: [...p[i], 0], endPos: [...p[(i + 1) % 4], 0], isConstruction: isC })).result)
  return ids
}

export default async function (api, { filewrite }) {
  const out = {}
  const { partId, skId, planeId } = await makeSketch(api, { name: 'ConstrImpl' })
  const S = api.v1.sketch

  // ---- A) updateGeometry toggle ----
  const tl = await line(api, skId, [0, 0, 0], [30, 0, 0])           // normal
  const before = (await S.getObjectInfo({ id: tl })).result?.isConstruction
  await S.updateGeometry({ id: skId, lines: [{ id: tl, isConstruction: true }] })
  const afterOn = (await S.getObjectInfo({ id: tl })).result?.isConstruction
  await S.updateGeometry({ id: skId, lines: [{ id: tl, isConstruction: false }] })
  const afterOff = (await S.getObjectInfo({ id: tl })).result?.isConstruction
  out.toggle = { before, afterOn, afterOff }

  // ---- B) construction line as a live TANGENT reference ----
  const skT = await addSketch(api, partId, planeId, 'Tangent')
  const axis = (await S.line({ id: skT, startPos: [0, -50, 0], endPos: [0, 50, 0], isConstruction: true })).result
  const cir = await circle(api, skT, [30, 0, 0], 10)               // seeded off-tangent at x=30
  await S.constraint([{ id: skT, type: 'TANGENT', geomIds: [cir, axis] }])
  const cpts = (await S.getPoints({ id: cir })).result
  const cc = (await S.getPositions({ id: cpts.centerId })).result
  out.tangentToConstruction = { center: [cc.pos.x, cc.pos.y], radius: 10, expected: 'center.x ≈ ±10 (tangent to x=0 axis)', enforced: Math.abs(Math.abs(cc.pos.x) - 10) < 1e-3 }

  // ---- C) extrusion: normal square OK, construction square rejected ----
  const skN = await addSketch(api, partId, planeId, 'ExtrudeNormal')
  const nRect = await rectLines(api, skN, [0, 0], [40, 40], false)
  const rN = await api.v1.part.extrusion({ id: partId, references: nRect, limit2: 25 })
  out.extrudeNormal = { result: rN?.result ?? null, ok: rN?.result != null, msgs: err(rN) }

  const skC = await addSketch(api, partId, planeId, 'ExtrudeConstr')
  const cRect = await rectLines(api, skC, [80, 0], [120, 40], true)  // construction square
  const rC = await api.v1.part.extrusion({ id: partId, references: cRect, limit2: 25 })
  out.extrudeConstruction = { result: rC?.result ?? null, rejected: rC?.result == null, msgs: err(rC) }

  filewrite(out, '03-implications')
  console.log('[03] toggle isConstruction', JSON.stringify(out.toggle))
  console.log('[03] TANGENT to construction line → center', JSON.stringify(out.tangentToConstruction.center), 'enforced:', out.tangentToConstruction.enforced)
  console.log('[03] extrude NORMAL square →', JSON.stringify({ ok: out.extrudeNormal.ok, result: out.extrudeNormal.result }))
  console.log('[03] extrude CONSTRUCTION square → rejected:', out.extrudeConstruction.rejected, '| msgs', JSON.stringify(out.extrudeConstruction.msgs))
  return { ok: true }
}
