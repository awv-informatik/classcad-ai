export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprBindingTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Create expression
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'filletR', value: 15 }] })

  await api.v1.common.recalc({})
  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result

  // Create fillet with numeric radius=5
  const filletId = (await api.v1.part.fillet({
    id: partId,
    name: 'ExprFillet',
    references: edges.lines,
    radius: 5,
  })).result
  console.log('[07] filletId:', filletId)

  await snapshot('numeric-r5')

  // Update to use expression
  await api.v1.part.openFeature({ id: filletId })
  const r1 = await api.v1.part.updateFillet({ id: filletId, radius: '@expr.filletR' })
  console.log('[07] expr update result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'expr-update-response')
  await api.v1.part.closeFeature({ id: filletId })

  await snapshot('expr-r15')

  // Change expression value to 25 and recalc
  await api.v1.part.expression({ id: partId, toUpdate: [{ name: 'filletR', value: 25 }] })
  await api.v1.common.recalc({})

  await snapshot('expr-r25')

  // Revert to numeric
  await api.v1.part.openFeature({ id: filletId })
  const r2 = await api.v1.part.updateFillet({ id: filletId, radius: 8 })
  console.log('[07] numeric revert result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'numeric-revert-response')
  await api.v1.part.closeFeature({ id: filletId })

  await snapshot('numeric-r8')
  return { filletId }
}
