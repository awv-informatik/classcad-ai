export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateCPInvert' })).result

  // Non-symmetric shape to see direction change
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 10, height: 20,
    xPosition: 40, yPosition: 10, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  const cpId = (await api.v1.part.circularPattern({
    id: partId,
    name: 'CP1',
    targets: [boxId],
    references: [waZ],
    angle: 1.0472, // 60°
    count: 3,
    inverted: 0,
  })).result

  await snapshot('before-invert')

  // Toggle inverted
  await api.v1.part.openFeature({ id: cpId })
  const r = await api.v1.part.updateCircularPattern({
    id: cpId,
    inverted: 1,
  })
  await api.v1.part.closeFeature({ id: cpId })
  console.log('[03] update inverted result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-invert')

  return { partId, cpId }
}
