/** 00b — diagnose the curve-API space tool: volume, single subtraction, batch. */
import { inch, sprocketSpec, polygonizeSpace, polyArea } from './_model.mjs'

export default async function (api, { snapshot, filewrite }) {
  const mm = (v) => v * inch
  const spec = sprocketSpec({ teeth: 21, strands: 1, hubStyle: 'B', bore: 1.0, keyway: true, setScrews: 2, boreChamfer: 0.03 })
  const partId = (await api.v1.part.create({ name: 'DiagCurve' })).result
  const eif = (await api.v1.part.entityInjection({ id: partId, name: 'Body' })).result
  const mp = async (label) => {
    const r = await api.v1.part.calculateMassProperties({ id: partId })
    const v = r.result ? r.result.volume / inch ** 3 : null
    console.log(`[00b] ${label}: vol=${v?.toFixed(5) ?? 'NULL'} (maxLevel ${r.maxLevel})`)
    return v
  }

  // blank via rotated section shape
  const bl = (await api.v1.curve.shape({ id: eif, name: 'Blank' })).result
  await api.v1.curve.advancedPolyline({ id: bl, pld: spec.profile.map(([v, r]) => ({ xa: mm(r), ya: mm(v) })), close: true })
  const rot = await api.v1.curve.rotateShape({ id: bl, rotation: [Math.PI / 2, 0, 0] })
  console.log('[00b] rotateShape:', rot.maxLevel)
  const blank = (await api.v1.solid.revolve({ id: eif, originPos: [0, 0, 0], direction: [0, 0, 1], angle: 2 * Math.PI, curves: bl })).result
  console.log('[00b] blank id:', blank)
  const v1 = await mp('blank') // expect ≈2.6608

  // space shape from curve lines+arcs
  const sh = (await api.v1.curve.shape({ id: eif, name: 'Space' })).result
  for (const e of spec.tf.entities) {
    if (e.kind === 'line') {
      const r = await api.v1.curve.line({ id: sh, startPos: [mm(e.start[0]), mm(e.start[1]), 0], endPos: [mm(e.end[0]), mm(e.end[1]), 0] })
      if (r.maxLevel > 31) console.log('[00b] line ERR', JSON.stringify(r.messages))
    } else {
      const r = await api.v1.curve.arcByCenter({
        id: sh, centerPos: [mm(e.center[0]), mm(e.center[1]), 0],
        startPos: [mm(e.start[0]), mm(e.start[1]), 0], endPos: [mm(e.end[0]), mm(e.end[1]), 0], isClockwise: e.cw,
      })
      if (r.maxLevel > 31) console.log('[00b] arc ERR', JSON.stringify(r.messages))
    }
  }
  const span = mm(spec.vMax - spec.vMin + 0.2)
  const e0 = await api.v1.solid.extrusion({ id: eif, curves: sh, direction: [0, 0, span], translation: [0, 0, mm(spec.vMin - 0.1)] })
  console.log('[00b] extrusion:', e0.result, e0.maxLevel, JSON.stringify((e0.messages ?? []).map((m) => m.message)))
  const v2 = await mp('after 1 space tool')
  const toolVol = v2 - v1
  const expect = polyArea(polygonizeSpace(spec.tf)) * (spec.vMax - spec.vMin + 0.2)
  console.log(`[00b] tool volume: ${toolVol?.toFixed(5)} vs expected ${expect.toFixed(5)}`)
  await snapshot('one-tool')

  // single subtraction
  const s1 = await api.v1.solid.subtraction({ id: eif, target: blank, tools: [e0.result], keepTools: false })
  console.log('[00b] subtract 1 tool:', s1.result, s1.maxLevel, JSON.stringify((s1.messages ?? []).map((m) => m.message)))
  await mp('after subtract 1')

  // a rotated one
  const e1 = await api.v1.solid.extrusion({ id: eif, curves: sh, direction: [0, 0, span], rotation: [0, 0, (2 * Math.PI) / 21], translation: [0, 0, mm(spec.vMin - 0.1)] })
  console.log('[00b] rotated extrusion:', e1.result, e1.maxLevel)
  const s2 = await api.v1.solid.subtraction({ id: eif, target: blank, tools: [e1.result], keepTools: false })
  console.log('[00b] subtract rotated:', s2.result, s2.maxLevel, JSON.stringify((s2.messages ?? []).map((m) => m.message)))
  await mp('after subtract 2')
  await snapshot('two-cuts')
  return {}
}
