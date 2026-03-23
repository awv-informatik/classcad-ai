// Follow-up: test ln with known values, and check available constants
export default async function ({ execute }) {
  const tests = [
    ['ln(1)', 0, 'ln(1) should be 0'],
    ['ln(exp(1))', 1, 'ln(e) should be 1'],
    ['ln(2.718281828)', null, 'ln(2.718...)'],
    ['log(10)', 1, 'log(10) should be 1 if base 10'],
    ['log(1000)', 3, 'log(1000)'],
    // deg in expressions
    ['sin(90deg)', 1, 'sin(90deg)'],
    ['cos(180deg)', -1, 'cos(180deg)'],
    // Test what constants exist
    ['C:PI', Math.PI, 'C:PI'],
    ['C:2PI', null, 'C:2PI?'],
    ['C:HALF_PI', null, 'C:HALF_PI?'],
    ['C:INF', null, 'C:INF?'],
    // Comparison/boolean in expr
    ['3 > 2', null, '3 > 2 (comparison)'],
    ['3 == 3', null, '3 == 3 (equality)'],
    ['TRUE + TRUE', null, 'TRUE + TRUE'],
    ['TRUE * 5', null, 'TRUE * 5'],
    // Ternary / conditional
    ['if(TRUE, 1, 0)', null, 'if function?'],
    // String operations
    ['"hello"', null, 'string literal?'],
  ]

  for (const [expr, expected, label] of tests) {
    const r = await execute({
      'v1.common.evaluateExpression': [{ expression: expr, silent: 1 }]
    })
    const match = expected !== null && r.result !== null && Math.abs(r.result - expected) < 0.0001 ? '=' : ''
    console.log(`[15] ${label}: ${expr} → ${JSON.stringify(r.result)} ${match}`)
  }

  return {}
}
