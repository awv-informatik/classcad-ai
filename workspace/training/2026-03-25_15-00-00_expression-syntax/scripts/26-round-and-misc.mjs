// Check round() with different args, and test C:E and other constants without silent
export default async function (api) {
  // round tests
  const roundTests = ['round()', 'round(2.5, 0)', 'round(2.567, 2)', 'round(2.5, 1)']
  for (const expr of roundTests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    console.log(`[26] '${expr}' = ${r.result} maxLevel:${r.maxLevel}`)
    if (r.messages?.length) {
      for (const m of r.messages) console.log(`[26]   msg: ${m.message.substring(0, 100)}`)
    }
  }

  // Constants without silent
  const constTests = ['C:E', 'C:PI', 'E', 'PI', 'C:pi', 'INF', 'NaN']
  for (const expr of constTests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    console.log(`[26] '${expr}' = ${r.result} maxLevel:${r.maxLevel}`)
    if (r.messages?.length) {
      for (const m of r.messages) console.log(`[26]   msg: ${m.message.substring(0, 100)}`)
    }
  }

  // Does inline negative work as '2 + (-3)'?
  const negTests = ['2 + (-3)', '(-3) + 2', '5 * (-1)', '(-2) * (-3)']
  for (const expr of negTests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    console.log(`[26] '${expr}' = ${r.result}`)
  }

  return {}
}
