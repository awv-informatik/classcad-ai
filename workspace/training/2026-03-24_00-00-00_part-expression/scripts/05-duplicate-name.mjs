// Test: what happens when creating an expression with a name that already exists?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create 'width' with value 50
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'width', value: 50 }],
  })
  console.log('[05] first create:', r1.result, 'maxLevel:', r1.maxLevel)

  // Try to create 'width' again with different value
  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'width', value: 999 }],
  })
  console.log('[05] duplicate create:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] messages:', JSON.stringify(r2.messages))

  // Check what value 'width' has now
  const val = await api.v1.common.evaluateExpression({ expression: 'width', id: 6 })
  console.log('[05] width value after duplicate:', val.result)

  return { partId }
}
