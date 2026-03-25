// Syntax errors — what's invalid?
export default async function (api) {
  const tests = [
    '2 + + 3',
    '2 * * 3',
    '(2 + 3',       // unmatched paren
    '2 + 3)',
    '',              // empty
    '   ',           // whitespace only
    'abc',           // undefined variable (standalone)
    '2 & 3',        // bitwise?
    '2 | 3',
    '2 > 3',        // comparison?
    '2 < 3',
    '2 == 3',
    'true',
    'false',
    '2 ? 3 : 4',    // ternary?
    'if(1, 2, 3)',   // conditional function?
  ]

  for (const expr of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: true })
    console.log(`[13] '${expr}' → result:${r.result} maxLevel:${r.maxLevel}`)
  }

  return {}
}
