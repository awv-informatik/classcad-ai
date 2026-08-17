// Basic arithmetic and operator precedence
export default async function (api) {
  const tests = [
    ['2+3', 5],
    ['10-4', 6],
    ['6*7', 42],
    ['100/4', 25],
    ['2+3*4', 14],       // precedence: 2+(3*4)=14 not (2+3)*4=20
    ['(2+3)*4', 20],     // explicit parens
    ['-5', -5],           // unary minus
    ['--5', 5],           // double negative?
    ['2.5*4', 10],        // floats
    ['1/3', 1/3],         // fractional result
  ]
  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const pass = Math.abs(r.result - expected) < 1e-10
    console.log(`[01] ${expr} = ${r.result} (expected ${expected}) ${pass ? '✓' : '❌'}`)
  }
}
