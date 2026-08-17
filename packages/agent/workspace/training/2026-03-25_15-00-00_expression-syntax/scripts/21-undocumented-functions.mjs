// Probe for undocumented functions
export default async function (api) {
  const probes = [
    'ceil(2.3)',
    'floor(2.7)',
    'round(2.5)',
    'trunc(2.7)',
    'cbrt(27)',       // cube root
    'hypot(3, 4)',    // sqrt(a^2 + b^2)
    'log2(8)',
    'log10(100)',
    'clamp(5, 0, 10)',
    'lerp(0, 100, 0.5)',
    'step(0.5, 0.3)',
    'mod(10, 3)',
    'rem(10, 3)',
    'int(3.7)',
    'float(3)',
    'rand()',
    'random()',
    'PI',
    'E',
    'INF',
    'NaN',
  ]

  for (const expr of probes) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: true })
    const status = r.maxLevel <= 31 ? '✓ EXISTS' : '✗ nope'
    console.log(`[21] ${status} '${expr}' = ${r.result} maxLevel:${r.maxLevel}`)
  }

  return {}
}
