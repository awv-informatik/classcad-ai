// Error cases: invalid expression, division by zero, unknown function
export default async function (api, { filewrite }) {
  const tests = [
    'INVALID!!!',
    '1/0',
    'sqrt(-1)',
    'unknown_func(5)',
    '',
    '2++3',
  ]
  const results = []
  for (const expr of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    console.log(`[05] "${expr}" → result:`, r.result, 'maxLevel:', r.maxLevel)
    if (r.messages && r.messages.length) {
      console.log(`[05]   messages:`, r.messages.map(m => m.message).join('; '))
    }
    results.push({ expr, result: r.result, maxLevel: r.maxLevel, messages: r.messages })
  }
  filewrite(results, 'error-cases')
}
