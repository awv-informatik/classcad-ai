// Can expression values be strings (non-numeric)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Try a quoted string value
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'label', value: '"hello"' }],
  })
  console.log('[13] quoted string result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[13] quoted string messages:', JSON.stringify(r1.messages))

  // Try a plain string (no quotes)
  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'plain', value: 'hello' }],
  })
  console.log('[13] plain string result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[13] plain string messages:', JSON.stringify(r2.messages))

  // Numeric string
  const r3 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'numstr', value: '42' }],
  })
  console.log('[13] numeric string result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Verify numeric string evaluates correctly
  if (r3.result === 1) {
    const v = await api.v1.common.evaluateExpression({ expression: 'numstr', id: 6 })
    console.log('[13] numstr =', v.result)
  }

  return { partId }
}
