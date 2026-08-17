export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTransInv' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 25,
    xPosition: 40, yPosition: 0, zPosition: 0,
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
    inverted: 0,
  })).result

  await snapshot('before-invert')

  // Toggle inverted
  await api.v1.part.openFeature({ id: tId })
  const r = await api.v1.part.updateTranslation({ id: tId, inverted: 1 })
  await api.v1.part.closeFeature({ id: tId })
  console.log('[02] update inverted result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-invert')

  return { partId }
}
