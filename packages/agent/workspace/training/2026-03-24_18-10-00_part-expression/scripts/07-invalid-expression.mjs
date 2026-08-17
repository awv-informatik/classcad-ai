// What happens with invalid expression values?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Syntax error in value
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'bad_syntax', value: '2 + + 3' }],
  })
  console.log('[07] syntax error result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] syntax error messages:', JSON.stringify(r1.messages))

  // Reference to nonexistent expression
  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'bad_ref', value: 'nonexistent * 2' }],
  })
  console.log('[07] bad ref result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[07] bad ref messages:', JSON.stringify(r2.messages))

  // Division by zero
  const r3 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'div_zero', value: '1/0' }],
  })
  console.log('[07] div/0 result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[07] div/0 messages:', JSON.stringify(r3.messages))

  return { partId }
}
