export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotExpr' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'rotAngle', value: 'C:PI/4' }],
  })

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 15, height: 20,
    xPosition: 20, yPosition: 0, zPosition: 0,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'Ref',
    height: 5, diameter: 8,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  const rId = (await api.v1.part.rotation({
    id: partId,
    name: 'RotExpr',
    targets: [boxId],
    references: [waZ],
    angle: '@expr.rotAngle',
  })).result
  console.log('[03] expr rotation result:', rId)

  await snapshot('expr-rotation')

  return { partId }
}
