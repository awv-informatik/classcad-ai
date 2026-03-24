// Create expression, use in box, then verify the expression is wired (for later updateExpression tests)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 100 },
      { name: 'W', value: 60 },
      { name: 'H', value: 40 },
    ],
  })

  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'MyBox',
    length: '@expr.L',
    width: '@expr.W',
    height: '@expr.H',
  })).result

  await snapshot('before')

  // Verify the box was created with correct dimensions by checking the structure
  const r = await api.v1.part.getExpression({ id: partId, name: 'L' })
  console.log('[20] L expression:', JSON.stringify(r.result))
  const r2 = await api.v1.part.getExpression({ id: partId, name: 'W' })
  console.log('[20] W expression:', JSON.stringify(r2.result))
  const r3 = await api.v1.part.getExpression({ id: partId, name: 'H' })
  console.log('[20] H expression:', JSON.stringify(r3.result))

  return { partId, boxId }
}
