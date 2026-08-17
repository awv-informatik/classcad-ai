export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprTest' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'copies', value: 6 },
      { name: 'spacing_angle', value: 'C:PI/3' }, // 60 degrees
    ],
  })

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 15, width: 10, height: 20,
    xPosition: 45, yPosition: 0, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_expr',
    targets: [boxId],
    references: [waZ],
    angle: '@expr.spacing_angle',
    count: '@expr.copies',
  })
  console.log('[06] expression-driven: result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('expr-pattern')

  return { partId }
}
