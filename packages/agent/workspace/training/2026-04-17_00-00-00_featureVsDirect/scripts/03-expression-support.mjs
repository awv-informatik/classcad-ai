export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprTest' })).result

  // Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 80 },
      { name: 'W', value: 60 },
      { name: 'H', value: 40 },
    ],
  })

  // Feature box — use expressions
  const featBoxId = (await api.v1.part.box({
    id: partId, name: 'ExprBox',
    length: '@expr.L', width: '@expr.W', height: '@expr.H',
  })).result
  console.log('[03] part.box with expressions:', featBoxId)

  await snapshot('expr-before')

  // Update expression and see if box changes
  await api.v1.part.updateExpression({ id: partId, name: 'H', value: '120' })
  await api.v1.common.recalc()

  const hVal = (await api.v1.part.getExpression({ id: partId, name: 'H' })).result
  console.log('[03] H after update:', JSON.stringify(hVal))

  await snapshot('expr-after')

  // Now try solid.box with expression strings — docs say it only takes real
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solidExprR = await api.v1.solid.box({
    id: eifId, length: '@expr.L', width: '@expr.W', height: '@expr.H',
    translation: [120, 0, 0],
  })
  console.log('[03] solid.box with @expr result:', solidExprR.result, 'maxLevel:', solidExprR.maxLevel)
  filewrite({ result: solidExprR.result, messages: solidExprR.messages, maxLevel: solidExprR.maxLevel }, 'solid-expr-result')

  // Also try with inline math
  const solidMathR = await api.v1.solid.box({
    id: eifId, length: '3*25', width: 50, height: 50,
    translation: [120, 80, 0],
  })
  console.log('[03] solid.box with math string result:', solidMathR.result, 'maxLevel:', solidMathR.maxLevel)
  filewrite({ result: solidMathR.result, messages: solidMathR.messages, maxLevel: solidMathR.maxLevel }, 'solid-math-result')

  await snapshot('solid-expr-attempts')

  return { partId, featBoxId, eifId }
}
