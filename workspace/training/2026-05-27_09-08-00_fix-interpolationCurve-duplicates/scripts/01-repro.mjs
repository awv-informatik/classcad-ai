// Repro for TODO #2: curve.interpolationCurve hangs on duplicate consecutive points.
// JS-side timeout converts hang into a visible "timeout" so the harness doesn't wedge.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpDup' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  const withTimeout = (p, ms, label) =>
    Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms)),
    ])

  const cases = [
    ['two-consecutive-duplicates', [[0,0,0], [10,20,0], [10,20,0], [20,0,0]]],
    ['all-duplicates', [[5,5,0], [5,5,0], [5,5,0]]],
    ['empty-array', []],
    ['single-point', [[3,4,5]]],
    ['valid-baseline', [[0,0,0], [5,15,0], [10,0,0]]],
  ]

  const results = {}
  for (const [label, points] of cases) {
    console.log(`[repro] ${label} (${points.length} pts)...`)
    try {
      const r = await withTimeout(
        api.v1.curve.interpolationCurve({ id: shapeId, points }),
        8000,
        label,
      )
      console.log(`  → maxLevel=${r.maxLevel} messages=${JSON.stringify(r.messages)}`)
      results[label] = { maxLevel: r.maxLevel, messages: r.messages }
    } catch (e) {
      console.error(`  → FAILED: ${e.message}`)
      results[label] = { error: e.message }
      // After a hang we must stop — worker is wedged and subsequent calls will also fail.
      break
    }
  }

  filewrite(results, 'repro-results')
  return results
}
