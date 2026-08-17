export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprChamfer' })).result

  // Create expression for chamfer size
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'chamferDist', value: 10 }],
  })

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  const edgeIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines

  // Create chamfer with expression-driven distance1
  const r = await api.v1.part.chamfer({
    id: partId,
    name: 'ExprChamfer',
    references: edgeIds,
    distance1: '@expr.chamferDist',
  })
  console.log('[11] chamfer result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[11] messages:', JSON.stringify(r.messages))

  await snapshot('dist-10')

  // Update expression to 25
  await api.v1.part.updateExpression({ id: partId, name: 'chamferDist', value: '25' })
  await api.v1.common.recalc({})

  await snapshot('dist-25')

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'chamfer-response')

  return { partId, chamferId: r.result }
}
