// 07 — empty values:[] — single [0,1] no-op (preTrim-style) or VOID/error (splitCurves-style)?
import { makeSketch, line, summarizeSplit, firstError } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const before = (await api.v1.sketch.getGeometry({ id: skId })).result

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [] }] })
  const after = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel, before, after }, '07-result')
  console.log('[07]', JSON.stringify(summarizeSplit(r)), 'err', JSON.stringify(firstError(r)))
  console.log('[07] before.lines', JSON.stringify(before.lines), 'after.lines', JSON.stringify(after.lines))

  const isArr = Array.isArray(r.result)
  const segs = isArr ? r.result[0]?.splittedCurves : null
  console.log('[07] verdict:',
    !isArr ? 'ERROR/VOID (splitCurves-style)'
    : segs?.length === 1 && JSON.stringify(segs[0].interval) === '[0,1]' ? 'NO-OP single [0,1] (preTrim-style)'
    : `other (segs=${segs?.length})`)
  return { isArr, maxLevel: r.maxLevel, geomUnchanged: JSON.stringify(before.lines) === JSON.stringify(after.lines) }
}
