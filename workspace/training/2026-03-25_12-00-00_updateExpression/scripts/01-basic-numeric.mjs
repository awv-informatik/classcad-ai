// Test basic numeric value update via updateExpression
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create an expression
  const cr = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'width', value: 100 }],
  })
  console.log('[01] create result:', cr.result, 'maxLevel:', cr.maxLevel)

  // Read before update
  const before = await api.v1.part.getExpression({ id: partId, name: 'width' })
  console.log('[01] before:', JSON.stringify(before.result))

  // Update to a new numeric value
  const ur = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'width', value: 200 }],
  })
  console.log('[01] update result:', ur.result, 'maxLevel:', ur.maxLevel)

  // Read after update
  const after = await api.v1.part.getExpression({ id: partId, name: 'width' })
  console.log('[01] after:', JSON.stringify(after.result))

  return { partId, before: before.result, after: after.result, updateResult: ur.result }
}
