// Follow-up: evaluateExpression("[1,2,3]") returned a JS array [1,2,3]
// Is this a documented behavior? How does it differ from {1,2,3}?
export default async function ({ execute }) {
  const tests = [
    ['array-3', '[1,2,3]'],
    ['array-2', '[1,2]'],
    ['array-1', '[1]'],
    ['array-4', '[1,2,3,4]'],
    ['array-empty', '[]'],
    ['nested', '[[1,2],[3,4]]'],
    ['point-curly', '{1,2,3}'],
    ['mixed', '[{1,2,3},{4,5,6}]'],
  ]

  for (const [label, expr] of tests) {
    const r = await execute({ 'v1.common.evaluateExpression': [{ expression: expr, silent: true }] })
    console.log(`[expr-arr] ${label} "${expr}": result=${JSON.stringify(r.result)} type=${typeof r.result} isArray=${Array.isArray(r.result)} maxLevel=${r.maxLevel}`)
  }

  return {}
}
