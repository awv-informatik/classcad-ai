export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprVerify' })).result

  // Create expression
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'H', value: 40 }],
  })

  // Feature box driven by expression
  const boxId = (await api.v1.part.box({
    id: partId, name: 'ExprBox',
    length: 80, width: 60, height: '@expr.H',
  })).result

  // Also create a reference box (fixed size) to see relative change
  const refBoxId = (await api.v1.part.box({
    id: partId, name: 'RefBox',
    length: 20, width: 20, height: 20,
  })).result

  // Dump the structure before update
  const r1 = await api.v1.common.getAppVersion({})
  filewrite(r1.graphic, 'graphic-before')

  await snapshot('before-expr-update')

  // Update expression value
  const updateR = await api.v1.part.updateExpression({ id: partId, name: 'H', value: '120' })
  console.log('[12] updateExpression result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-expr-result')

  // Recalc
  const recalcR = await api.v1.common.recalc()
  console.log('[12] recalc result:', recalcR.result, 'maxLevel:', recalcR.maxLevel)

  // Verify expression value
  const hVal = (await api.v1.part.getExpression({ id: partId, name: 'H' })).result
  console.log('[12] H after update:', JSON.stringify(hVal))

  // Dump the structure after update
  const r2 = await api.v1.common.getAppVersion({})
  filewrite(r2.graphic, 'graphic-after')

  await snapshot('after-expr-update')

  return { partId, boxId }
}
