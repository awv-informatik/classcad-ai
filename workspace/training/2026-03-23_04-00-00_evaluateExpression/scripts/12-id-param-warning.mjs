// Check warning message when evaluating with ExpressionSet id, and try other ids
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'ExprWarn' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'x', value: 10 },
      { name: 'y', value: 'x * 3' },
    ],
  })

  // With ExpressionSet id (6) — check messages
  const r1 = await api.v1.common.evaluateExpression({ expression: 'y', id: 6 })
  console.log('[12] id=6 result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages.length) {
    console.log('[12] id=6 messages:', JSON.stringify(r1.messages))
  }

  // With ExpressionSet id — compound expression
  const r2 = await api.v1.common.evaluateExpression({ expression: 'x + y + 5', id: 6 })
  console.log('[12] "x + y + 5" id=6:', r2.result, '(expected 45)')

  // Try silent with id
  const r3 = await api.v1.common.evaluateExpression({ expression: 'y', id: 6, silent: true })
  console.log('[12] silent+id=6 result:', r3.result, 'maxLevel:', r3.maxLevel, 'msgCount:', r3.messages.length)

  // Try with partId — check error message
  const r4 = await api.v1.common.evaluateExpression({ expression: 'x', id: partId })
  console.log('[12] id=partId result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages.length) {
    console.log('[12] id=partId messages:', r4.messages.map(m => m.message).join('; '))
  }

  return { partId }
}
