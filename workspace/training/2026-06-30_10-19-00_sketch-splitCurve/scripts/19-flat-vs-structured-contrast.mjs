// 19 — contrast vs deprecated splitCurves (flat array). Same geometry + values.
// splitCurve -> structured [{sourceId,splittedCurves:[{id,interval}]}]; splitCurves -> flat Array<Array<id>>.
import { makeSketch, line, positions, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const L1 = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const L2 = await line(api, skId, [0, 20, 0], [100, 20, 0])

  const rNew = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: L1, values: [0.25, 0.75] }] })
  const rOld = await api.v1.sketch.splitCurves({ id: skId, splits: [{ geomId: L2, values: [0.25, 0.75] }] })
  filewrite({ splitCurve: rNew.result, splitCurves: rOld.result }, '19-contrast')
  console.log('[19] splitCurve  (new):', JSON.stringify(rNew.result))
  console.log('[19] splitCurves (old):', JSON.stringify(rOld.result))

  // new is structured
  const newStructured = Array.isArray(rNew.result) && rNew.result[0]?.sourceId === L1 &&
    Array.isArray(rNew.result[0]?.splittedCurves) && 'interval' in (rNew.result[0].splittedCurves[0] || {})
  // old is flat: Array<Array<id>>, no sourceId/interval
  const oldEntry = Array.isArray(rOld.result) ? rOld.result[0] : null
  const oldFlat = Array.isArray(oldEntry) && oldEntry.every(x => typeof x === 'number')

  // both cut at the same world x — verify a new segment endpoint and an old segment endpoint
  const newCut = await positions(api, rNew.result[0].splittedCurves[0].id)
  const oldCut = await positions(api, oldEntry?.[0])
  const checks = {
    newIsStructured: newStructured,
    oldIsFlatIdArray: oldFlat,
    newHasSourceIdInterval: newStructured,
    oldLacksSourceId: oldEntry != null && !('sourceId' in (oldEntry || {})),
    both3Segments: rNew.result[0].splittedCurves.length === 3 && (oldEntry?.length === 3),
    newCutAt25: vecApprox(newCut.endPos, [25, 0, 0]),
    oldCutAt25: vecApprox(oldCut.endPos, [25, 20, 0]),
  }
  console.log('[19] CHECKS', JSON.stringify(checks))
  console.log('[19]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
