// Isolated test: numeric string as value (script 13 was contaminated by prior errors)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // A string that is a valid numeric expression
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'numstr', value: '42' }],
  })
  console.log('[16] numstr result:', r1.result, 'maxLevel:', r1.maxLevel)

  // A string that is a valid formula
  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'formula', value: '6 * 7' }],
  })
  console.log('[16] formula result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Verify
  const v1 = await api.v1.common.evaluateExpression({ expression: 'numstr', id: 6 })
  const v2 = await api.v1.common.evaluateExpression({ expression: 'formula', id: 6 })
  console.log('[16] numstr =', v1.result)
  console.log('[16] formula =', v2.result)

  return { partId }
}
