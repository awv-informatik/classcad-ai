// Test: missing/edge-case parameters
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // No toCreate array
  const r1 = await api.v1.part.expression({ id: partId })
  console.log('[07] no toCreate:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] messages:', JSON.stringify(r1.messages))

  // Empty toCreate array
  const r2 = await api.v1.part.expression({ id: partId, toCreate: [] })
  console.log('[07] empty toCreate:', r2.result, 'maxLevel:', r2.maxLevel)

  // Missing name in toCreate item
  const r3 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ value: 50 }],
  })
  console.log('[07] no name:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[07] messages:', JSON.stringify(r3.messages))

  // Missing value in toCreate item
  const r4 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'test1' }],
  })
  console.log('[07] no value:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[07] messages:', JSON.stringify(r4.messages))

  // Check if test1 was created and what value it has
  if (r4.result) {
    const val = await api.v1.common.evaluateExpression({ expression: 'test1', id: 6 })
    console.log('[07] test1 value (no value given):', val.result)
  }

  return { partId }
}
