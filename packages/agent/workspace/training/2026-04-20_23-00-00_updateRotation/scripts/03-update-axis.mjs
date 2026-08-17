export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateRotAxis' })).result

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

  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  const rId = (await api.v1.part.rotation({
    id: partId,
    targets: [boxId],
    references: [waZ],
    angle: 1.5708,
  })).result

  await snapshot('around-z')

  // Change axis from Z to X
  await api.v1.part.openFeature({ id: rId })
  const r = await api.v1.part.updateRotation({ id: rId, references: [waX] })
  await api.v1.part.closeFeature({ id: rId })
  console.log('[03] update axis result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('around-x')

  return { partId }
}
