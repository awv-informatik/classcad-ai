// 17 — Verify expression linking: update with @expr.name, then check structure paramName
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create expression first
  const exprR = await api.v1.part.updateExpression({ id: partId, name: 'myWidth', value: 75 })
  console.log('[17] createExpr maxLevel:', exprR.maxLevel)

  const skId = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1], name: 'widthDim' })).result

  // Update with expression
  const r = await api.v1.sketch.updateDimension({ id: dimId, value: '@expr.myWidth' })
  console.log('[17] expr update result:', r.result, 'maxLevel:', r.maxLevel)

  // Check dimension in structure tree
  const dimNode = r.structure?.tree?.[String(dimId)]
  if (dimNode) {
    console.log('[17] paramName after expr link:', dimNode.members?.paramName?.value)
    console.log('[17] paramName expression:', dimNode.members?.paramName?.expression)
    filewrite(dimNode, 'dim-node-after-expr')
  }

  // Now update back to numeric
  const r2 = await api.v1.sketch.updateDimension({ id: dimId, value: 50 })
  const dimNode2 = r2.structure?.tree?.[String(dimId)]
  if (dimNode2) {
    console.log('[17] paramName after numeric:', dimNode2.members?.paramName?.value)
    filewrite(dimNode2, 'dim-node-after-numeric')
  }

  return { partId }
}
