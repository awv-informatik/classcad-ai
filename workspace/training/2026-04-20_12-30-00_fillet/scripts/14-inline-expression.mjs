export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletInlineExpr' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result

  // Test inline math expression as shown in docs: radius: '5/2'
  const r = await api.v1.part.fillet({
    id: partId,
    name: 'InlineFillet',
    references: geoIds.lines,
    radius: '5/2',
  })
  console.log('[14] inline "5/2" result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[14] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'inline-expr')

  if (r.result) {
    await snapshot('inline-2.5')
  }

  // Also test inline expression with constant: 'C:PI * 3'
  // (This would be a weird radius but tests expression evaluation)
  const partId2 = (await api.v1.part.create({ name: 'FilletConstExpr' })).result
  const boxId2 = (await api.v1.part.box({ id: partId2, name: 'Box2', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})
  const geoIds2 = (await api.v1.part.getGeometryIds({ id: partId2, lines: [{ pos: [40, 0, 40] }] })).result

  const r2 = await api.v1.part.fillet({
    id: partId2,
    name: 'ConstFillet',
    references: geoIds2.lines,
    radius: '10+5',
  })
  console.log('[14] inline "10+5" result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[14] r2 messages:', JSON.stringify(r2.messages))

  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'inline-math')

  if (r2.result) {
    await snapshot('inline-15')
  }

  return { partId, partId2 }
}
