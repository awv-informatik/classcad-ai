// Test: real result type from evaluateExpression
// Questions: Is it a JS number? Float vs integer? Precision?
export default async function ({ execute }) {
  const tests = [
    ['integer', '2+3'],
    ['float', '1/3'],
    ['trig', 'sin(C:PI/2)'],
    ['large', '10^15'],
    ['small', '10^-15'],
    ['negative', '-42'],
    ['zero', '0'],
    ['pi', 'C:PI'],
    ['irrational', 'sqrt(2)'],
  ]

  for (const [label, expr] of tests) {
    const r = await execute({ 'v1.common.evaluateExpression': [{ expression: expr }] })
    console.log(`[${label}] expr="${expr}" result=${r.result} type=${typeof r.result} isInteger=${Number.isInteger(r.result)} isFinite=${Number.isFinite(r.result)}`)
  }

  return {}
}
