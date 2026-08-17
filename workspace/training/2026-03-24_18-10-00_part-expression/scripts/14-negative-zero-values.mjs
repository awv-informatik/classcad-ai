// Test edge case numeric values: 0, negative, very large, float
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'zero', value: 0 },
      { name: 'negative', value: -50 },
      { name: 'big', value: 999999 },
      { name: 'small', value: 0.001 },
      { name: 'pi_approx', value: 3.14159 },
    ],
  })
  console.log('[14] result:', r.result, 'maxLevel:', r.maxLevel)

  for (const name of ['zero', 'negative', 'big', 'small', 'pi_approx']) {
    const v = await api.v1.common.evaluateExpression({ expression: name, id: 6 })
    console.log(`[14] ${name} =`, v.result)
  }

  return { partId }
}
