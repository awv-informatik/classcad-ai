// Delete an expression used by a feature via @expr.NAME
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'S', value: 60 }],
  })

  await api.v1.part.box({
    id: partId,
    name: 'TestBox',
    length: '@expr.S',
    width: '@expr.S',
    height: '@expr.S',
  })

  await snapshot('before-delete')

  // Delete expression used by the box
  const dr = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['S'],
  })
  console.log('[06] delete linked expr result:', dr.result, 'maxLevel:', dr.maxLevel)
  if (dr.messages?.length) {
    for (const m of dr.messages) console.log('[06] msg:', m.level, m.code, m.message)
  }

  // Does recalc break things?
  const rr = await api.v1.common.recalc()
  console.log('[06] recalc result:', rr.result, 'maxLevel:', rr.maxLevel)
  if (rr.messages?.length) {
    for (const m of rr.messages) console.log('[06] recalc msg:', m.level, m.code, m.message)
  }

  await snapshot('after-delete-and-recalc')

  return { partId }
}
