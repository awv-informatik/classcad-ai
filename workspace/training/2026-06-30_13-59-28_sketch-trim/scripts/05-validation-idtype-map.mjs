// 05 — id-type map: wrong-type `id` (part/point) and wrong-type `curveIds` element (sketch/point/constraint).
// Capture the verbatim expected-type list string in each 1001 message.
import { makeSketch, line, firstError, nodeById } from './_setup.mjs'

const typeList = errs => { const m = (errs || []).map(e => e.message).join(' '); const mt = m.match(/\[("[^"]+"(?:,\s*"[^"]+")*)\]/); return mt ? mt[0] : null }

export default async function (api, { filewrite }) {
  const { partId, skId } = await makeSketch(api)
  const L = await line(api, skId, [0, 50, 0], [100, 50, 0])
  await line(api, skId, [50, 0, 0], [50, 100, 0])
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const validSeg = pre.result[0].splittedCurves[0].id
  const pointId = (await api.v1.sketch.getPoints({ id: L })).result?.startId
  const tree = pre.structure?.tree
  const constraintId = Object.values(tree || {}).find(n => /Constraint/.test(n.class || ''))?.id

  async function probe(label, param) {
    const r = await api.v1.sketch.trim(param)
    const errs = firstError(r)
    const row = { label, maxLevel: r.maxLevel, code: errs[errs.length - 1]?.code, list: typeList(errs), msg: errs[errs.length - 1]?.message }
    console.log('[05]', JSON.stringify(row))
    return row
  }

  const out = []
  out.push(await probe('idPart', { id: partId, curveIds: [validSeg] }))
  out.push(await probe('idPoint', { id: pointId, curveIds: [validSeg] }))
  out.push(await probe('cidSketch', { id: skId, curveIds: [skId] }))
  out.push(await probe('cidPoint', { id: skId, curveIds: [pointId] }))
  out.push(await probe('cidConstraint', { id: skId, curveIds: [constraintId] }))
  filewrite({ partId, pointId, constraintId, validSeg, out }, '05-idtype')
  console.log('[05] id type-list:', out[0].list, '| curveIds type-list:', out[3].list)
  return { out }
}
