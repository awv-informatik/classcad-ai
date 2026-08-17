// What happens when toCreate has a mix of valid and invalid entries?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'good1', value: 10 },
      { name: 'bad_syntax', value: '2++3' },
      { name: 'good2', value: 20 },
    ],
  })
  console.log('[09] partial result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))

  // Check which ones actually got created
  const v1 = await api.v1.common.evaluateExpression({ expression: 'good1', id: 6 })
  console.log('[09] good1 =', v1.result, 'maxLevel:', v1.maxLevel)

  const v2 = await api.v1.common.evaluateExpression({ expression: 'bad_syntax', id: 6 })
  console.log('[09] bad_syntax =', v2.result, 'maxLevel:', v2.maxLevel)

  const v3 = await api.v1.common.evaluateExpression({ expression: 'good2', id: 6 })
  console.log('[09] good2 =', v3.result, 'maxLevel:', v3.maxLevel)

  return { partId }
}
