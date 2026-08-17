// Complex formula syntax: nested functions, long chains, edge cases
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Deeply nested formulas
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 10 },
      { name: 'b', value: 20 },
      { name: 'c', value: 30 },
      // Nested: max of min and sqrt
      { name: 'nested', value: 'max(min(a, b), sqrt(c))' },
      // Chained arithmetic with multiple refs
      { name: 'chain', value: '(a + b) * c / (a - 1)' },
      // Trig composition
      { name: 'trigComp', value: 'sin(a_r(a * 3))' },
      // Conditional-like: max/min as clamp
      { name: 'clamped', value: 'min(max(a * 5, 20), 100)' },
      // Very long expression
      { name: 'long_expr', value: 'a + b + c + a*b + b*c + a*c + sqrt(a*a + b*b + c*c)' },
    ],
  })
  console.log('[09] complex formulas result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Evaluate each
  for (const name of ['nested', 'chain', 'trigComp', 'clamped', 'long_expr']) {
    const v = await api.v1.common.evaluateExpression({ expression: name, id: 6 })
    console.log(`[09] ${name} =`, v.result)
  }

  return { partId }
}
