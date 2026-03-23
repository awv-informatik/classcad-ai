// Follow-up: 10^15 failed — is ^ not power? What is the power operator?
// Also: deeper point investigation — {1,2,3} returned {x,y,z}
export default async function (api) {
  // Power operator investigation
  const powTests = [
    '10^15',       // failed — ^ might be XOR or something else
    'pow(10,15)',  // try pow() function
    'power(10,15)',
    '10**15',      // JS-style
    'exp(15*ln(10))',
    '2^3',         // simpler case
    '2^0.5',       // sqrt via ^
  ]

  for (const expr of powTests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: true })
    console.log(`[power] "${expr}" result=${r.result} type=${typeof r.result} maxLevel=${r.maxLevel}`)
  }

  // Deeper point investigation
  console.log('\n--- Point deep dive ---')
  const ptTests = [
    '{1,2,3}',
    '{0,0,0}',
    '{-1.5, 2.7, 3.14}',
    '{1,2}',           // 2D point?
    '{1}',             // scalar?
    '{1,2,3,4}',       // 4 elements?
    '{1,2,3}+{4,5,6}', // point arithmetic?
    '{1,2,3}*2',       // scalar multiply?
    '2*{1,2,3}',
  ]

  for (const expr of ptTests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: true })
    console.log(`[point] "${expr}" result=${JSON.stringify(r.result)} type=${typeof r.result} maxLevel=${r.maxLevel}`)
  }

  return {}
}
