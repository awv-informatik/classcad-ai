// Test: confirm box works with numeric values (sanity check after script 13 failures)
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxR = await api.v1.part.box({
    id: partId,
    name: 'NumericBox',
    length: 120,
    width: 80,
    height: 60,
  })
  console.log('[14] numeric box:', boxR.result, 'maxLevel:', boxR.maxLevel)

  // Also test inline expression string (not named ref)
  const boxR2 = await api.v1.part.box({
    id: partId,
    name: 'FormulaBox',
    length: '60*2',
    width: '40+40',
    height: '30*2',
  })
  console.log('[14] formula box:', boxR2.result, 'maxLevel:', boxR2.maxLevel)

  await snapshot('boxes')

  return { partId }
}
