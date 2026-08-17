// Get expression with invalid/missing part ID
export default async function (api) {
  // Bad ID
  const r1 = await api.v1.part.getExpression({ id: 'bogus', name: 'x' })
  console.log('[04] bad id result:', JSON.stringify(r1.result))
  console.log('[04] bad id maxLevel:', r1.maxLevel)
  console.log('[04] bad id messages:', JSON.stringify(r1.messages?.map(m => m.message)))

  // Missing id param entirely
  const r2 = await api.v1.part.getExpression({ name: 'x' })
  console.log('[04] no id result:', JSON.stringify(r2.result))
  console.log('[04] no id maxLevel:', r2.maxLevel)
  console.log('[04] no id messages:', JSON.stringify(r2.messages?.map(m => m.message)))

  return {}
}
