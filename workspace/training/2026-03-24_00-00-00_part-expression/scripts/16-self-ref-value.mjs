// Test: what value does a self-referencing expression get?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Self-reference
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'd', value: 'd + 1' }],
  })

  const dVal = await api.v1.common.evaluateExpression({ expression: 'd', id: 6 })
  console.log('[16] d value:', dVal.result, 'maxLevel:', dVal.maxLevel)
  console.log('[16] d messages:', JSON.stringify(dVal.messages?.map(m => m.message.substring(0, 100))))

  // Try mutual references: e = f, f = e
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'e', value: 10 },
      { name: 'f', value: 'e * 2' },
    ],
  })
  // Now try to make e reference f (circular)
  // Wait — we can't update here, that's updateExpression. Just document self-ref for now.

  return { partId }
}
