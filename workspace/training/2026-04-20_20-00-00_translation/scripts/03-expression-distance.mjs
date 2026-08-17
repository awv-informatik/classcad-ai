export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TransExpr' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'offset', value: 60 }],
  })

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 25,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    height: 5, diameter: 10,
  })).result

  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  const tId = (await api.v1.part.translation({
    id: partId,
    name: 'TransExpr',
    targets: [boxId],
    references: [waX],
    distance: '@expr.offset',
  })).result
  console.log('[03] expr translation result:', tId)

  await snapshot('expr-translation')

  return { partId }
}
