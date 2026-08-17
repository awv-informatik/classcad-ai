// Can updateExpression change the formula, not just the numeric value?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'x', value: 10 },
      { name: 'y', value: 'x * 2' },
    ],
  })

  let v = await api.v1.part.getExpression({ id: partId, name: 'y' })
  console.log('[14] y before:', JSON.stringify(v.result))

  // Update y to a new formula
  const r = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'y', value: 'x * 3 + 5' }],
  })
  console.log('[14] updateExpression result:', r.result, 'maxLevel:', r.maxLevel)

  await api.v1.common.recalc()

  v = await api.v1.part.getExpression({ id: partId, name: 'y' })
  console.log('[14] y after:', JSON.stringify(v.result), '(expect expr="x * 3 + 5", value=35)')

  // Update y to a plain number
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'y', value: 99 }],
  })
  await api.v1.common.recalc()

  v = await api.v1.part.getExpression({ id: partId, name: 'y' })
  console.log('[14] y after numeric:', JSON.stringify(v.result), '(expect expr="", value=99)')

  return { partId }
}
