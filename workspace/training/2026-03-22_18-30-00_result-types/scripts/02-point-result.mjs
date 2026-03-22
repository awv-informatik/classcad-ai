// Test: point result type from evaluateExpression
// Docs say result can be real|point|VOID — what's the JS shape of a point?
export default async function ({ execute }) {
  const attempts = [
    'point(1,2,3)',
    'Point(1,2,3)',
    'POINT(1,2,3)',
    '{1,2,3}',
    '[1,2,3]',
    'vec(1,2,3)',
    'pt(1,2,3)',
    'point(0,0,0)',
    '(1,2,3)',
  ]

  for (const expr of attempts) {
    const r = await execute({ 'v1.common.evaluateExpression': [{ expression: expr, silent: true }] })
    const v = r.result
    console.log(`[point] expr="${expr}" result=${JSON.stringify(v)} type=${typeof v} isNull=${v===null} isArray=${Array.isArray(v)} maxLevel=${r.maxLevel}`)
  }

  return {}
}
