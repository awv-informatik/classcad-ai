export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MergedDebug' })).result

  // Create a box that will overlap when rotated 90 degrees
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 20, height: 25,
    xPosition: 30, yPosition: -10, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  // Merged pattern
  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_merged',
    targets: [boxId],
    references: [waZ],
    angle: 1.5708,
    count: 4,
    merged: 1,
  })
  console.log('[04b] merged result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'merged-response')

  await snapshot('merged-debug')

  return { partId }
}
