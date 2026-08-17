// 23 — solver independence: split on a PLANELESS (dead-solver) sketch vs a planeId twin on the same part.
import { makeSketch, addPlanelessSketch, line, positions, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { partId, skId } = await makeSketch(api) // planeId (Top) sketch
  const skPL = await addPlanelessSketch(api, partId, 'planeless')
  console.log('[23] planeId sketch', skId, 'planeless sketch', skPL)

  // planeId twin
  const lP = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const rP = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: lP, values: [0.5] }] })
  const cutP = Array.isArray(rP.result) ? await positions(api, rP.result[0].splittedCurves[0].id) : null

  // planeless
  const lL = await line(api, skPL, [0, 0, 0], [100, 0, 0])
  const rL = await api.v1.sketch.splitCurve({ id: skPL, splits: [{ geomId: lL, values: [0.5] }] })
  const cutL = Array.isArray(rL.result) ? await positions(api, rL.result[0].splittedCurves[0].id) : null

  filewrite({ planeId: { ok: Array.isArray(rP.result), cut: cutP?.endPos }, planeless: { ok: Array.isArray(rL.result), cut: cutL?.endPos } }, '23-planeless')
  console.log('[23] planeId   cut at', JSON.stringify(cutP?.endPos), 'maxLevel', rP.maxLevel)
  console.log('[23] planeless cut at', JSON.stringify(cutL?.endPos), 'maxLevel', rL.maxLevel)

  const checks = {
    planeIdSplits: Array.isArray(rP.result) && vecApprox(cutP?.endPos, [50, 0, 0]),
    planelessSplits: Array.isArray(rL.result) && vecApprox(cutL?.endPos, [50, 0, 0]),
    identical: vecApprox(cutP?.endPos, cutL?.endPos),
  }
  console.log('[23] CHECKS', JSON.stringify(checks))
  console.log('[23]', checks.planelessSplits ? 'splitCurve is SOLVER-INDEPENDENT' : 'planeless behaves differently — see data')
  return { checks }
}
