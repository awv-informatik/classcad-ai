export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprTest' })).result

  // Create expressions first
  await api.v1.part.expression({ id: partId, toCreate: [
    { name: 'L', value: 80 },
    { name: 'W', value: 50 },
    { name: 'H', value: 30 },
  ]})

  // Create uncommitted box
  const boxId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'ExprBox' })).result
  console.log('[18] uncommitted box:', boxId)

  // Commit with expression-driven dimensions
  await api.v1.part.openFeature({ id: boxId })
  const updateR = await api.v1.part.updateBox({ id: boxId, length: '@expr.L', width: '@expr.W', height: '@expr.H' })
  console.log('[18] updateBox with exprs:', updateR.result, 'maxLevel:', updateR.maxLevel)
  await api.v1.part.closeFeature({ id: boxId })

  // Verify the box has expression-driven values
  const recR = await api.v1.common.recalc({})
  const tree = recR.structure?.tree
  const node = tree?.[boxId]
  if (node) {
    console.log('[18] length:', node.members.length.value, 'expr:', node.members.length.expression)
    console.log('[18] width:', node.members.width.value, 'expr:', node.members.width.expression)
    console.log('[18] height:', node.members.height.value, 'expr:', node.members.height.expression)
    filewrite(node, 'expr-box-node')
  }

  await snapshot('expr-driven-box')

  // Update the expression and verify the box changes
  await api.v1.part.updateExpression({ id: partId, name: 'L', value: '120' })
  await api.v1.common.recalc({})
  const recR2 = await api.v1.common.recalc({})
  const node2 = recR2.structure?.tree?.[boxId]
  if (node2) {
    console.log('[18] after L=120: length:', node2.members.length.value)
  }

  await snapshot('after-expr-update')
  return { partId, boxId }
}
