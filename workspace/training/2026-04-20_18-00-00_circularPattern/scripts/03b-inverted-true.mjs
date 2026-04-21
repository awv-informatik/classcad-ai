export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvertedTrueTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 10, height: 20,
    xPosition: 40, yPosition: 10, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  // Inverted
  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_inverted',
    targets: [boxId],
    references: [waZ],
    angle: 1.0472, // 60 degrees
    count: 3,
    inverted: 1,
  })
  console.log('[03b] inverted=1: result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('inverted1')

  return { partId }
}
