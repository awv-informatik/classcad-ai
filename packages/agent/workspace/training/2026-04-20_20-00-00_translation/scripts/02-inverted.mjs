export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TransInverted' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 25,
    xPosition: 50, yPosition: 0, zPosition: 0,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    height: 5, diameter: 10,
  })).result

  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  await snapshot('before')

  // Translate with inverted=1 — should go in -X direction
  const tId = (await api.v1.part.translation({
    id: partId,
    name: 'TransInv',
    targets: [boxId],
    references: [waX],
    distance: 40,
    inverted: 1,
  })).result
  console.log('[02] inverted translation result:', tId)

  await snapshot('after-inverted')

  return { partId }
}
