/** 00d — the real tooth-space profile as curve chain: which winding/flags work?
 *  i) as-is (CW loop, sketch-convention flags)   — known broken
 * ii) flags inverted, same order
 * iii) chain REVERSED (CCW loop: entities reversed, start/end swapped, flags inverted)
 */
import { inch, sprocketSpec, polygonizeSpace, polyArea } from './_model.mjs'

export default async function (api, { filewrite }) {
  const mm = (v) => v * inch
  const spec = sprocketSpec({ teeth: 21, strands: 1, hubStyle: 'B', bore: 1.0, keyway: true, setScrews: 0 })
  const span = 10
  const expect = polyArea(polygonizeSpace(spec.tf)) * (span / inch)
  const out = {}

  const tryCase = async (label, ents) => {
    const partId = (await api.v1.part.create({ name: label })).result
    const eif = (await api.v1.part.entityInjection({ id: partId, name: 'E' })).result
    const sh = (await api.v1.curve.shape({ id: eif, name: 'S' })).result
    for (const e of ents) {
      if (e.kind === 'line')
        await api.v1.curve.line({ id: sh, startPos: [mm(e.start[0]), mm(e.start[1]), 0], endPos: [mm(e.end[0]), mm(e.end[1]), 0] })
      else
        await api.v1.curve.arcByCenter({
          id: sh, centerPos: [mm(e.center[0]), mm(e.center[1]), 0],
          startPos: [mm(e.start[0]), mm(e.start[1]), 0], endPos: [mm(e.end[0]), mm(e.end[1]), 0], isClockwise: e.cw,
        })
    }
    const ex = await api.v1.solid.extrusion({ id: eif, curves: sh, direction: [0, 0, span] })
    const r = (await api.v1.part.calculateMassProperties({ id: partId })).result
    const vol = r ? r.volume / inch ** 3 : null
    out[label] = { extLevel: ex.maxLevel, extId: ex.result, volIn3: vol, expected: +expect.toFixed(5), ok: vol !== null && Math.abs(vol - expect) < 0.002 }
    console.log(`[00d] ${label}:`, JSON.stringify(out[label]))
    await api.v1.common.clear({})
  }

  await tryCase('asis', spec.tf.entities)
  await tryCase('flagsInv', spec.tf.entities.map((e) => ({ ...e, cw: !e.cw })))
  await tryCase('reversed', [...spec.tf.entities].reverse().map((e) => ({ ...e, start: e.end, end: e.start, cw: !e.cw })))
  filewrite(out, 'winding-probe')
  return out
}
