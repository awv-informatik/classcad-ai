// Test linking a dimension to an expression via linkWithExpression
// Since @expr.NAME doesn't work in updateDimension, this is the correct approach
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ExprViaLink' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  // Create expression
  await api.v1.part.expression({ id: partId, name: 'myLen', value: 150 })

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  const dimR = await api.v1.sketch.dimension({ id: skId, name: 'len', type: 'OFFSET', geomIds: [lineId] })
  const dimId = dimR.result

  const p0 = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[10] initial endX:', p0.endPos.x)

  // Try linkWithExpression with correct params: id=dimId, exprName='myLen', name='value'
  const linkR = await api.v1.part.linkWithExpression({ id: dimId, exprName: 'myLen', name: 'value' })
  console.log('[10] linkWithExpression result:', linkR.result, 'maxLevel:', linkR.maxLevel)
  console.log('[10] linkWithExpression messages:', JSON.stringify(linkR.messages))

  const p1 = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[10] after link endX:', p1.endPos.x, '(expect 150)')

  // Update expression to 200
  await api.v1.part.updateExpression({ id: partId, name: 'myLen', value: 200 })
  const p2 = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[10] after expr→200 endX:', p2.endPos.x, '(expect 200)')

  // Update expression to 50
  await api.v1.part.updateExpression({ id: partId, name: 'myLen', value: 50 })
  const p3 = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[10] after expr→50 endX:', p3.endPos.x, '(expect 50)')

  await snapshot('result')

  filewrite({
    link: { result: linkR.result, maxLevel: linkR.maxLevel, messages: linkR.messages },
    initialEndX: p0.endPos.x,
    afterLinkEndX: p1.endPos.x,
    afterExpr200EndX: p2.endPos.x,
    afterExpr50EndX: p3.endPos.x,
  }, 'expr-via-link-data')

  return { partId }
}
