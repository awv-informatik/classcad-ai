// Test updateDimension with @expr.NAME expression linking
// dimension.md says @expr.NAME doesn't work at creation — does it work via updateDimension?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ExprLink' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  // Create expression
  const exprR = await api.v1.part.expression({ id: partId, name: 'myWidth', value: 150 })
  console.log('[02] expression created:', exprR.result, 'maxLevel:', exprR.maxLevel)

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // Fix bottom-left
  const pts = (await api.v1.sketch.getPoints({ id: rectIds[0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  // Create dimension (auto-value = 80)
  const dimId = (await api.v1.sketch.dimension({ id: skId, name: 'width', type: 'OFFSET', geomIds: [rectIds[0]] })).result

  // Before
  const posBefore = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  console.log('[02] before:', JSON.stringify(posBefore))

  // Update with @expr.myWidth — should link to expression and set value to 150
  const updR = await api.v1.sketch.updateDimension({ id: dimId, value: '@expr.myWidth' })
  console.log('[02] updateDimension @expr result:', updR.result, 'maxLevel:', updR.maxLevel)
  console.log('[02] updateDimension messages:', JSON.stringify(updR.messages))

  const posAfter = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  console.log('[02] after:', JSON.stringify(posAfter))

  await snapshot('after-expr')

  // Now update the expression to 200 — does the dimension follow?
  const updExprR = await api.v1.part.updateExpression({ id: partId, name: 'myWidth', value: 200 })
  console.log('[02] updateExpression result:', updExprR.result, 'maxLevel:', updExprR.maxLevel)

  const posAfterExpr = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  console.log('[02] after expr update:', JSON.stringify(posAfterExpr))

  await snapshot('after-expr-update')

  filewrite({
    dimId,
    updateResult: updR.result,
    updateMaxLevel: updR.maxLevel,
    updateMessages: updR.messages,
    posBefore,
    posAfterLink: posAfter,
    posAfterExprUpdate: posAfterExpr,
  }, 'expr-link-data')

  return { partId, dimId }
}
