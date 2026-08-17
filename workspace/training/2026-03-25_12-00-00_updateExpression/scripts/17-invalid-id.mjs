// Test with invalid/missing id parameter
export default async function (api) {
  // Missing id entirely
  const r1 = await api.v1.part.updateExpression({
    toUpdate: [{ name: 'x', value: 1 }],
  })
  console.log('[17] no id result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) console.log('[17] msg:', m.level, m.code, m.message)
  }

  // Bogus id
  const r2 = await api.v1.part.updateExpression({
    id: 'fakeid123',
    toUpdate: [{ name: 'x', value: 1 }],
  })
  console.log('[17] bogus id result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log('[17] msg:', m.level, m.code, m.message)
  }

  return {}
}
