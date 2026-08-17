export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MergedOverlap' })).result

  // Long box that extends past center — guarantees overlap at 90° rotation
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 60, width: 15, height: 20,
    xPosition: -10, yPosition: -7.5, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  await snapshot('before-merged')

  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_merged',
    targets: [boxId],
    references: [waZ],
    angle: 1.5708,
    count: 4,
    merged: 1,
  })
  console.log('[04c] merged overlapping result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    filewrite({ messages: r1.messages }, 'merged-overlap-msgs')
  }

  await snapshot('after-merged')

  return { partId }
}
