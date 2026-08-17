export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletExpr2' })).result

  // Fix: use toCreate array syntax for expression creation
  const exprR = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'filletR', value: 12 }],
  })
  console.log('[08] expression created:', exprR.result, 'maxLevel:', exprR.maxLevel)

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result

  // Test A: @expr.filletR syntax (same as chamfer used)
  const rA = await api.v1.part.fillet({
    id: partId,
    name: 'ExprFillet',
    references: geoIds.lines,
    radius: '@expr.filletR',
  })
  console.log('[08] @expr.filletR result:', rA.result, 'maxLevel:', rA.maxLevel)
  if (rA.messages?.length) console.log('[08] messages:', JSON.stringify(rA.messages))
  filewrite({ syntax: '@expr.filletR', result: rA.result, messages: rA.messages, maxLevel: rA.maxLevel }, 'expr-at-syntax')

  if (rA.result) {
    await snapshot('expr-at-12')
  }

  // If @expr failed, try inline math expression
  if (!rA.result) {
    console.log('[08] @expr syntax failed, trying inline math...')

    // Try inline expression '5/2'
    const rB = await api.v1.part.fillet({
      id: partId,
      name: 'InlineFillet',
      references: geoIds.lines,
      radius: '5/2',
    })
    console.log('[08] inline "5/2" result:', rB.result, 'maxLevel:', rB.maxLevel)
    if (rB.messages?.length) console.log('[08] messages:', JSON.stringify(rB.messages))
    filewrite({ syntax: '5/2', result: rB.result, messages: rB.messages, maxLevel: rB.maxLevel }, 'expr-inline')

    if (rB.result) {
      await snapshot('inline-2.5')
    }
  }

  return { partId }
}
