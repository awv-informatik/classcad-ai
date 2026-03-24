// Test: find ExpressionSet ID by scanning IDs
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  console.log('[18] partId:', partId)

  // Create expression
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'x', value: 42 }],
  })

  // Scan IDs 1-20 to find which one resolves 'x'
  for (let testId = 1; testId <= 20; testId++) {
    const r = await api.v1.common.evaluateExpression({
      expression: 'x',
      id: testId,
      silent: true,
    })
    if (r.result !== null) {
      console.log(`[18] ID ${testId}: x = ${r.result} ✓`)
    }
  }

  // Also check: does the structure tree from the harness show us IDs?
  // The harness returns r.structure — let's check a simple call
  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'y', value: 99 }],
  })
  filewrite(r, 'expression-full-response')

  return { partId }
}
