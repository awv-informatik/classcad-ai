// Constants: C:PI and probing for others
export default async function (api) {
  const tests = [
    'C:PI',
    'C:E',          // Euler's number?
    'C:PI / 2',
    'C:PI * 2',
    '2 * C:PI',
    'C:PI * C:PI',
    'C:pi',         // case sensitivity?
    'C:Pi',
    'PI',           // without C: prefix?
    'pi',
    'e',
    'C:TAU',        // 2*pi?
    'C:SQRT2',      // sqrt(2)?
    'C:LN2',
    'C:DEG',        // degrees per radian?
  ]

  for (const expr of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: true })
    const status = r.maxLevel <= 31 ? '✓' : '❌'
    console.log(`[03] ${status} '${expr}' = ${r.result} maxLevel:${r.maxLevel}`)
  }

  return {}
}
