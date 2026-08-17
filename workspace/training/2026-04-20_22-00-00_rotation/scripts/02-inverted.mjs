export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotInverted' })).result

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

  // Rotate with inverted=1
  const rId = (await api.v1.part.rotation({
    id: partId,
    name: 'RotInv',
    targets: [boxId],
    references: [waZ],
    angle: 0.7854,
    inverted: 1,
  })).result
  console.log('[02] inverted rotation result:', rId)

  await snapshot('inverted-rotation')

  return { partId }
}
