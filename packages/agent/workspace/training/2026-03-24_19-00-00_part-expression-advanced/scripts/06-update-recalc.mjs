// Does updateExpression cause features to auto-recalculate?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'size', value: 60 }],
  })

  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'ParamBox',
    length: '@expr.size',
    width: '@expr.size',
    height: '@expr.size',
  })).result

  await snapshot('before-update')

  // Update the expression value
  const r = await api.v1.part.updateExpression({
    id: partId,
    name: 'size',
    value: 120,
  })
  console.log('[06] updateExpression result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-update')

  // Verify the expression value changed
  const v = await api.v1.part.getExpression({ id: partId, name: 'size' })
  console.log('[06] size after update:', JSON.stringify(v.result))

  return { partId, boxId }
}
