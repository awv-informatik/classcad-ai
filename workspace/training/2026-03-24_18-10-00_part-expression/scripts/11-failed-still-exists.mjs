// Do expressions with invalid formulas still get registered (exist but evaluate badly)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create an expression with a bad formula
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'bad_one', value: 'nonexistent * 2' }],
  })
  console.log('[11] create bad_one result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Try to create it again — if it was registered, we should get "already exists"
  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'bad_one', value: 99 }],
  })
  console.log('[11] re-create bad_one result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[11] re-create messages:', JSON.stringify(r2.messages))

  // Try getExpression to see if it exists
  const r3 = await api.v1.part.getExpression({ id: partId, name: 'bad_one' })
  console.log('[11] getExpression bad_one:', JSON.stringify(r3))

  return { partId }
}
