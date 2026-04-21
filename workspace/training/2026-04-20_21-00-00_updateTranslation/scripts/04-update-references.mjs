export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTransRefs' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 25,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'Ref',
    height: 5, diameter: 10,
  })).result

  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  const waY = (await api.v1.part.workAxis({
    id: partId, name: 'AxisY',
    origin: [0, 0, 0], direction: [0, 1, 0],
  })).result

  const tId = (await api.v1.part.translation({
    id: partId,
    targets: [boxId],
    references: [waX],
    distance: 50,
  })).result

  await snapshot('along-x')

  // Change direction to Y
  await api.v1.part.openFeature({ id: tId })
  const r = await api.v1.part.updateTranslation({ id: tId, references: [waY] })
  await api.v1.part.closeFeature({ id: tId })
  console.log('[04] update refs result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('along-y')

  return { partId }
}
