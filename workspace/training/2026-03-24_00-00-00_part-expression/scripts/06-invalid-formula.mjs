// Test: what happens with invalid formula values?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Invalid formula — referencing non-existent expression
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'bad1', value: 'nonExistent * 2' }],
  })
  console.log('[06] non-existent ref:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[06] messages:', JSON.stringify(r1.messages))

  // Syntax error in formula
  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'bad2', value: '2 + + 3' }],
  })
  console.log('[06] syntax error:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[06] messages:', JSON.stringify(r2.messages))

  // Empty string as value
  const r3 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'bad3', value: '' }],
  })
  console.log('[06] empty string:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[06] messages:', JSON.stringify(r3.messages))

  // Division by zero
  const r4 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'bad4', value: '1/0' }],
  })
  console.log('[06] div by zero:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[06] messages:', JSON.stringify(r4.messages))

  return { partId }
}
