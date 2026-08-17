export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[01] boxId:', boxId)

  await snapshot('before')

  // Open, update height, close
  const openR = await api.v1.part.openFeature({ id: boxId })
  console.log('[01] openFeature maxLevel:', openR.maxLevel)

  const upR = await api.v1.part.updateBox({ id: boxId, height: 120 })
  console.log('[01] updateBox result:', upR.result, 'maxLevel:', upR.maxLevel)
  filewrite({ result: upR.result, messages: upR.messages, maxLevel: upR.maxLevel }, 'update-response')

  const closeR = await api.v1.part.closeFeature({ id: boxId })
  console.log('[01] closeFeature maxLevel:', closeR.maxLevel)

  await snapshot('after')

  // Verify via getExpression
  const hExpr = await api.v1.part.getExpression({ id: boxId, name: 'height' })
  const wExpr = await api.v1.part.getExpression({ id: boxId, name: 'width' })
  const lExpr = await api.v1.part.getExpression({ id: boxId, name: 'length' })
  console.log('[01] after update — length:', lExpr.result, 'width:', wExpr.result, 'height:', hExpr.result)

  filewrite({ length: lExpr.result, width: wExpr.result, height: hExpr.result }, 'dims-after')

  return { partId, boxId }
}
