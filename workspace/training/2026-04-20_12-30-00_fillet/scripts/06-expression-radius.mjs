export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletExpr' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  // Create an expression for the radius
  await api.v1.part.expression({ id: partId, name: 'filletR', value: 12 })

  await api.v1.common.recalc({})

  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  console.log('[06] edge IDs:', JSON.stringify(geoIds.lines))

  // Create fillet with expression-driven radius
  const r = await api.v1.part.fillet({
    id: partId,
    name: 'ExprFillet',
    references: geoIds.lines,
    radius: '@expr.filletR',
  })
  console.log('[06] fillet result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'expr-fillet-response')

  await snapshot('expr-12')

  // Now update expression to change radius
  await api.v1.part.updateExpression({ id: partId, name: 'filletR', value: 25 })
  console.log('[06] updated filletR to 25')

  await snapshot('expr-25')

  // Verify expression read-back
  const exprVal = await api.v1.part.getExpression({ id: partId, name: 'filletR' })
  console.log('[06] filletR value:', exprVal.result)

  return { partId, filletId: r.result }
}
