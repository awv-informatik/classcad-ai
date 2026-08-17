export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprDistance' })).result

  // Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'spacing', value: 35 },
      { name: 'copies', value: 5 },
    ],
  })

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 15, width: 15, height: 20,
  })).result

  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'Axis',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // Use expression strings for distance and count
  const r = await api.v1.part.linearPattern({
    id: partId,
    name: 'LP_expr',
    targets: [boxId],
    dir1: {
      references: [waId],
      distance: '@expr.spacing',
      count: '@expr.copies',
    },
  })

  console.log('[07] expr result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'expr-response')
  await snapshot('expr-pattern')

  return { partId, lpId: r.result }
}
