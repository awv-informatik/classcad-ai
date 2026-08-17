// 08 — empty splits:[] — clean empty no-op? result:[] maxLevel<=31 geometry unchanged?
import { makeSketch, line, summarizeSplit, firstError } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  await line(api, skId, [0, 0, 0], [100, 0, 0]) // present but not referenced
  const before = (await api.v1.sketch.getGeometry({ id: skId })).result

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [] })
  const after = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel, before, after }, '08-result')
  console.log('[08]', JSON.stringify(summarizeSplit(r)), 'err', JSON.stringify(firstError(r)))

  const checks = {
    isArray: Array.isArray(r.result),
    emptyResult: Array.isArray(r.result) && r.result.length === 0,
    success: r.maxLevel <= 31,
    geomUnchanged: JSON.stringify(before.lines) === JSON.stringify(after.lines),
  }
  console.log('[08] CHECKS', JSON.stringify(checks))
  console.log('[08]', Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL (see verdict)')
  return { checks }
}
