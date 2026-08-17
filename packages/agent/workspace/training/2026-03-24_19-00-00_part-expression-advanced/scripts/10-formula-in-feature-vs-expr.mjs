// Compare: inline formula in feature param vs. same formula as named expression
// Are they equivalent? Does the feature "remember" the formula or just the computed value?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'R', value: 30 },
    ],
  })

  // Box 1: inline formula directly in feature param
  const box1 = (await api.v1.part.box({
    id: partId,
    name: 'InlineBox',
    length: '2 * C:PI * 30',   // hardcoded formula, no @expr ref
    width: 100,
    height: 50,
  })).result

  // Box 2: @expr formula referencing named expression
  const box2 = (await api.v1.part.box({
    id: partId,
    name: 'ExprBox',
    length: '2 * C:PI * @expr.R',  // references R
    width: 100,
    height: 50,
  })).result

  console.log('[10] box1 (inline):', box1)
  console.log('[10] box2 (@expr):', box2)

  // Now update R — only box2 should change
  await api.v1.part.updateExpression({ id: partId, name: 'R', value: 60 })

  await snapshot('after-R-update')
  return { partId, box1, box2 }
}
