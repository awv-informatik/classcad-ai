export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Correctly create expression with toCreate array
  const exprR = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'H', value: 80 }, { name: 'L', value: 60 }, { name: 'W', value: 40 }],
  })
  console.log('[12] expression create result:', exprR.result, 'maxLevel:', exprR.maxLevel)

  // Create box with @expr at creation time
  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })).result
  const boxR = await api.v1.part.box({ id: partId, name: 'Target', length: '@expr.L', width: '@expr.W', height: '@expr.H' })
  console.log('[12] box @expr create — result:', boxR.result, 'maxLevel:', boxR.maxLevel)
  filewrite({ result: boxR.result, messages: boxR.messages, maxLevel: boxR.maxLevel }, 'box-expr-create-response')

  if (boxR.result === null) {
    console.log('[12] box creation with @expr failed, cannot test updateBox')
    return { partId }
  }

  const boxId = boxR.result
  await snapshot('before')

  // Now try updateBox with @expr
  await api.v1.part.openFeature({ id: boxId })
  const up1 = await api.v1.part.updateBox({ id: boxId, height: '@expr.L' })
  console.log('[12] updateBox(@expr.L) — result:', up1.result, 'maxLevel:', up1.maxLevel)
  filewrite({ result: up1.result, messages: up1.messages, maxLevel: up1.maxLevel }, 'update-expr-response')
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after-expr-update')

  // Also test linkWithExpression as alternative
  await api.v1.part.openFeature({ id: boxId })
  const up2 = await api.v1.part.updateBox({ id: boxId, height: 200 })
  console.log('[12] updateBox(200) after expr — result:', up2.result, 'maxLevel:', up2.maxLevel)
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after-numeric-update')

  return { partId, boxId }
}
