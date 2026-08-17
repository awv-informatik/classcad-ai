export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoxExprTest' })).result

  // Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 80 },
      { name: 'W', value: 50 },
      { name: 'H', value: 'L * 0.5' },
    ],
  })

  // Box with @expr. syntax
  const r = await api.v1.part.box({
    id: partId,
    name: 'ExprBox',
    length: '@expr.L',
    width: '@expr.W',
    height: '@expr.H',
  })
  console.log('[04] expr box result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'expr-box-response')

  // Verify expression values
  const hVal = (await api.v1.part.getExpression({ id: partId, name: 'H' })).result
  console.log('[04] H expression:', JSON.stringify(hVal))

  await snapshot('expr-driven')
  return { partId, boxId: r.result }
}
