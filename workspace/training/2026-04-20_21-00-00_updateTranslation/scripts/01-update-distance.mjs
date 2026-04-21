export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTransDist' })).result

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

  const tId = (await api.v1.part.translation({
    id: partId,
    targets: [boxId],
    references: [waX],
    distance: 30,
  })).result

  await snapshot('before-update')

  // Update distance from 30 to 80
  await api.v1.part.openFeature({ id: tId })
  const r = await api.v1.part.updateTranslation({ id: tId, distance: 80 })
  await api.v1.part.closeFeature({ id: tId })
  console.log('[01] update distance result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-update-80')

  return { partId, tId }
}
