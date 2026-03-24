// What happens when creating an expression with a name that already exists?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create initial expression
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'width', value: 50 }],
  })
  console.log('[05] first create result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Try to create again with same name, different value
  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'width', value: 99 }],
  })
  console.log('[05] duplicate create result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] duplicate messages:', JSON.stringify(r2.messages))

  // Check what value width has now
  const v = await api.v1.common.evaluateExpression({ expression: 'width', id: 6 })
  console.log('[05] width value after duplicate:', v.result)

  return { partId, firstResult: r1.result, dupeResult: r2.result, finalValue: v.result }
}
