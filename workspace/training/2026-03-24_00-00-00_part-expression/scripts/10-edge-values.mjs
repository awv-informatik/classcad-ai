// Test: edge-case values — 0, negatives, very large, very small, decimal
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const tests = [
    { name: 'zero', value: 0 },
    { name: 'negative', value: -42 },
    { name: 'decimal', value: 3.14159 },
    { name: 'large', value: 1e15 },
    { name: 'tiny', value: 1e-10 },
    { name: 'negStr', value: '-100' },
  ]

  for (const t of tests) {
    const r = await api.v1.part.expression({
      id: partId,
      toCreate: [{ name: t.name, value: t.value }],
    })
    console.log(`[10] ${t.name}: result=${r.result} maxLevel=${r.maxLevel}`)
  }

  // Verify all values
  for (const t of tests) {
    const val = await api.v1.common.evaluateExpression({ expression: t.name, id: 6 })
    console.log(`[10] ${t.name} = ${val.result}`)
  }

  return { partId }
}
