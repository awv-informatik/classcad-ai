export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvertedTest' })).result

  // Use a non-symmetric shape offset in +X, +Y to see rotation direction
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 10, height: 20,
    xPosition: 40, yPosition: 10, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  // Normal (not inverted)
  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_normal',
    targets: [boxId],
    references: [waZ],
    angle: 1.0472, // 60 degrees
    count: 3,
    inverted: 0,
  })
  console.log('[03] inverted=0: result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('inverted0')

  return { partId }
}
