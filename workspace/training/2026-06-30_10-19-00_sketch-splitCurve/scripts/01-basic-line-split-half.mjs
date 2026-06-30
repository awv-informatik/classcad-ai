// 01 — happy path: split a line at 0.5; verify exact result shape + no leaked keys.
import { makeSketch, line, summarizeSplit } from './_setup.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [0.5] }] })
  const s = summarizeSplit(r)
  filewrite(r.result, '01-result')
  console.log('[01]', JSON.stringify(s))

  const e = r.result?.[0]
  const checks = {
    success: r.maxLevel <= 31,
    oneEntry: r.result?.length === 1,
    sourceIdMatches: e?.sourceId === l,
    twoSegments: e?.splittedCurves?.length === 2,
    entryKeysExact: JSON.stringify(Object.keys(e || {}).sort()) === JSON.stringify(['sourceId', 'splittedCurves']),
    segKeysExact: JSON.stringify(Object.keys(e?.splittedCurves?.[0] || {}).sort()) === JSON.stringify(['id', 'interval']),
    intervalIs2Numbers: Array.isArray(e?.splittedCurves?.[0]?.interval) && e.splittedCurves[0].interval.length === 2,
    noPartOfLeak: e?.splittedCurves?.every(sc => !('partOf' in sc)),
  }
  console.log('[01] CHECKS', JSON.stringify(checks))
  console.log('[01]', Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL')
  await snapshot('split-half')
  return { allPass: Object.values(checks).every(Boolean), checks }
}
