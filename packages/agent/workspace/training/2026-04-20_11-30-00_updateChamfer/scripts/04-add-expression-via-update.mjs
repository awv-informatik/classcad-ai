export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprUpdateTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Create expression
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'chamDist', value: 15 }] })

  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]

  // Create chamfer with numeric distance
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: [edgeId],
    distance1: 5,
  })).result
  console.log('[04] chamferId:', chamferId, 'created with distance1=5')
  await snapshot('initial-numeric')

  // Update to use expression
  await api.v1.part.openFeature({ id: chamferId })
  const r1 = await api.v1.part.updateChamfer({ id: chamferId, distance1: '@expr.chamDist' })
  console.log('[04] update to @expr.chamDist (15) — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'expr-update-response')
  await api.v1.part.closeFeature({ id: chamferId })
  await snapshot('after-expr-15')

  // Now change expression value and recalc
  await api.v1.part.updateExpression({ id: partId, name: 'chamDist', value: '25' })
  await api.v1.common.recalc({})
  await snapshot('after-expr-25')

  // Update back to numeric via updateChamfer
  await api.v1.part.openFeature({ id: chamferId })
  const r2 = await api.v1.part.updateChamfer({ id: chamferId, distance1: 8 })
  console.log('[04] update back to numeric 8 — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'back-to-numeric')
  await api.v1.part.closeFeature({ id: chamferId })
  await snapshot('after-numeric-8')

  return { chamferId }
}
