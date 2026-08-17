// Edge cases in formula syntax within feature params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'val', value: 100 },
    ],
  })

  // Negative expression in feature param
  const r1 = await api.v1.part.box({
    id: partId,
    name: 'NegTest',
    length: '-@expr.val',  // negative — will this work or error?
  })
  console.log('[19] negative expr result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.maxLevel > 31) console.log('[19] neg messages:', JSON.stringify(r1.messages))

  // Parenthesized expression
  const r2 = await api.v1.part.box({
    id: partId,
    name: 'ParenTest',
    length: '(@expr.val + 20) * 0.5',
  })
  console.log('[19] paren expr result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Very long formula
  const r3 = await api.v1.part.cylinder({
    id: partId,
    name: 'LongFormula',
    diameter: 'sqrt(pow(@expr.val, 2) + pow(@expr.val / 2, 2))',
    height: 'max(@expr.val * 0.3, 20)',
  })
  console.log('[19] long formula result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Ternary-like via min/max clamp
  const r4 = await api.v1.part.box({
    id: partId,
    name: 'ClampTest',
    length: 'min(max(@expr.val, 50), 200)',
    width: 'min(max(@expr.val, 50), 200)',
    height: 50,
  })
  console.log('[19] clamp formula result:', r4.result, 'maxLevel:', r4.maxLevel)

  await snapshot('formula-edge-cases')
  return { partId }
}
