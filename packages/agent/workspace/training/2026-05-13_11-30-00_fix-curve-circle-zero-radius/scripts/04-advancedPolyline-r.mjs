// Probe advancedPolyline.pld.r for the same radius<=0 issue. The doc claims r=0
// gives an "internal error in CurveHelper.ComputeFillet". Negative r isn't documented.
// Per the runbook: if proper error returns (no hang), no extra guard needed.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AdvPoly' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Poly' })).result

  const withTimeout = (p, ms, label) =>
    Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms)),
    ])

  const results = {}

  const cases = [
    ['r=0 (single corner)', () => api.v1.curve.advancedPolyline({
      id: shapeId,
      pld: [
        { xa: 0, ya: 0 },
        { xa: 0, ya: 50, r: 0 },
        { xa: 50, ya: 50 },
        { xa: 50, ya: 0 }
      ],
      close: true,
    })],
    ['r=-5 (negative)', () => api.v1.curve.advancedPolyline({
      id: shapeId,
      pld: [
        { xa: 100, ya: 0 },
        { xa: 100, ya: 50, r: -5 },
        { xa: 150, ya: 50 },
        { xa: 150, ya: 0 }
      ],
      close: true,
    })],
    ['r=10 (valid baseline)', () => api.v1.curve.advancedPolyline({
      id: shapeId,
      pld: [
        { xa: 200, ya: 0 },
        { xa: 200, ya: 50, r: 10 },
        { xa: 250, ya: 50 },
        { xa: 250, ya: 0 }
      ],
      close: true,
    })],
  ]

  for (const [label, fn] of cases) {
    console.log(`[adv] ${label}...`)
    try {
      const r = await withTimeout(fn(), 10000, label)
      console.log(`  → maxLevel=${r.maxLevel} messages=${JSON.stringify(r.messages)}`)
      results[label] = { maxLevel: r.maxLevel, messages: r.messages }
    } catch (e) {
      console.error(`  → FAILED: ${e.message}`)
      results[label] = { error: e.message }
    }
  }

  filewrite(results, 'advanced-polyline-r-probe')
  return results
}
