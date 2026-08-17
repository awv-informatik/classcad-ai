/** 00 — step diagnosis: which solid.* step breaks massProps? */
import { inch, sprocketSpec } from './_model.mjs'

export default async function (api, { filewrite }) {
  const mm = (v) => v * inch
  const spec = sprocketSpec({ teeth: 21, strands: 1, hubStyle: 'B', bore: 1.0, boreChamfer: 0.03, keyway: true, setScrews: 2 })
  const partId = (await api.v1.part.create({ name: 'Diag' })).result
  const eif = (await api.v1.part.entityInjection({ id: partId, name: 'Body' })).result
  const mp = async (label) => {
    const r = await api.v1.part.calculateMassProperties({ id: partId })
    console.log(`[00] ${label}: vol=${r.result ? (r.result.volume / inch ** 3).toFixed(4) : 'NULL'} maxLevel=${r.maxLevel}`)
    return r.result
  }

  const shape = (await api.v1.curve.shape({ id: eif, name: 'P' })).result
  const pl = await api.v1.curve.advancedPolyline({
    id: shape, pld: spec.profile.map(([v, r]) => ({ xa: mm(v), ya: mm(r) })), close: true,
  })
  console.log('[00] polyline maxLevel:', pl.maxLevel, JSON.stringify(pl.messages ?? []))
  const blank = (await api.v1.solid.revolve({
    id: eif, originPos: [0, 0, 0], direction: [1, 0, 0], angle: 2 * Math.PI, curves: shape,
  })).result
  console.log('[00] blank id:', blank)
  await mp('after blank revolve')

  // one tooth-space extrusion from Right-plane sketch curves
  const right = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
  const sk = (await api.v1.sketch.create({ id: partId, planeId: right, name: 'S' })).result
  const arcs = [], lines = []
  for (const e of spec.tf.entities) {
    if (e.kind === 'line') lines.push({ startPos: [mm(e.start[0]), mm(e.start[1]), 0], endPos: [mm(e.end[0]), mm(e.end[1]), 0] })
    else arcs.push({ startPos: [mm(e.start[0]), mm(e.start[1]), 0], endPos: [mm(e.end[0]), mm(e.end[1]), 0], centerPos: [mm(e.center[0]), mm(e.center[1]), 0], isClockwise: e.cw })
  }
  const g = await api.v1.sketch.geometry({ id: sk, lines, arcsByCenter: arcs, genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false })
  const refs = [...g.result.arcsByCenter, ...g.result.lines]
  const span = mm(spec.vMax - spec.vMin + 0.2)
  const e0 = await api.v1.solid.extrusion({ id: eif, curves: refs, direction: [span, 0, 0], translation: [mm(spec.vMin - 0.1), 0, 0] })
  console.log('[00] space extrusion:', e0.result, 'maxLevel', e0.maxLevel, JSON.stringify(e0.messages ?? []))
  await mp('after space extrusion')
  const e1 = await api.v1.solid.extrusion({ id: eif, curves: refs, direction: [span, 0, 0], rotation: [Math.PI / 7, 0, 0], translation: [mm(spec.vMin - 0.1), 0, 0], rotateFirst: true })
  console.log('[00] rotated space extrusion:', e1.result, 'maxLevel', e1.maxLevel)
  await mp('after rotated extrusion')

  const cyl = await api.v1.solid.cylinder({ id: eif, diameter: mm(1), height: mm(1), rotation: [0, Math.PI / 2, 0], translation: [mm(0.25), 0, 0] })
  console.log('[00] bore cyl:', cyl.result, 'maxLevel', cyl.maxLevel)
  await mp('after bore cylinder')

  const sub = await api.v1.solid.subtraction({ id: eif, target: blank, tools: [e0.result, e1.result, cyl.result].filter(Boolean), keepTools: false })
  console.log('[00] subtraction:', sub.result, 'maxLevel', sub.maxLevel, JSON.stringify(sub.messages ?? []))
  await mp('after subtraction')
  // recalc hazard proof: does common.recalc invalidate the EIF body?
  await api.v1.common.recalc({})
  await mp('after common.recalc')
  return {}
}
// appended: recalc hazard proof — see run 2
export async function recalcProof(api) {}
