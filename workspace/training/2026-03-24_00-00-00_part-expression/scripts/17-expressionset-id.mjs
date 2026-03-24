// Test: find the ExpressionSet ID reliably after part.create
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  console.log('[17] partId:', partId)

  // Create an expression so the ExpressionSet exists
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'x', value: 42 }],
  })

  // Get structure to find ExpressionSet
  const struct = (await api.v1.common.getStructure({ deep: true }))
  filewrite(struct.structure, 'structure')

  // Try evaluateExpression with different IDs to find which one works
  for (let testId = 1; testId <= 10; testId++) {
    const r = await api.v1.common.evaluateExpression({
      expression: 'x',
      id: testId,
      silent: true,
    })
    if (r.result !== null) {
      console.log(`[17] ID ${testId}: x = ${r.result} ✓`)
    }
  }

  return { partId }
}
