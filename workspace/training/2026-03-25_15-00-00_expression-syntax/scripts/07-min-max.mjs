// min and max — variadic
export default async function (api) {
  const tests = [
    ['max(1, 2)', 2],
    ['max(5, 3, 8, 1)', 8],
    ['max(-1, -5)', -1],
    ['min(1, 2)', 1],
    ['min(5, 3, 8, 1)', 1],
    ['min(-1, -5)', -5],
    ['max(1)', null],         // single arg?
    ['min(1)', null],
    ['max(1, 1)', 1],
    // Practical: clamping
    ['min(max(5, 10), 100)', null],   // clamp 5 to [10, 100] → 10
    ['min(max(50, 10), 100)', null],  // clamp 50 to [10, 100] → 50
    ['min(max(200, 10), 100)', null], // clamp 200 to [10, 100] → 100
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: true })
    const ok = expected !== null ? (Math.abs(r.result - expected) < 1e-10 ? '✓' : '❌') : '?'
    console.log(`[07] ${ok} '${expr}' = ${r.result} maxLevel:${r.maxLevel}${expected !== null ? ` (expected ${expected})` : ''}`)
  }

  return {}
}
