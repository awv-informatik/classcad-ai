// 06 — original curve id is replaced/invalidated; segment ids new/distinct/present/queryable.
import { makeSketch, line, positions } from './_setup.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])

  const before = (await api.v1.sketch.getGeometry({ id: skId })).result
  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [0.5] }] })
  const segIds = r.result[0].splittedCurves.map(s => s.id)
  const after = (await api.v1.sketch.getGeometry({ id: skId })).result
  const origAfter = await positions(api, l) // expect error
  filewrite({ before, after, segIds, origGetPositionsMaxLevel: origAfter.maxLevel }, '06-id-sets')
  console.log('[06] before.lines', JSON.stringify(before.lines), 'after.lines', JSON.stringify(after.lines))
  console.log('[06] segIds', JSON.stringify(segIds), 'orig getPositions maxLevel', origAfter.maxLevel)

  const checks = {
    origAbsentAfter: !after.lines.includes(l),
    netLinesPlus1: after.lines.length === before.lines.length + 1,
    segsPresent: segIds.every(id => after.lines.includes(id)),
    segsDistinctFromOrig: segIds.every(id => id !== l),
    segsDistinct: new Set(segIds).size === segIds.length,
    origGetPositionsErrors: origAfter.maxLevel >= 51,
  }
  console.log('[06] CHECKS', JSON.stringify(checks))
  console.log('[06]', Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL')
  return { allPass: Object.values(checks).every(Boolean), checks }
}
