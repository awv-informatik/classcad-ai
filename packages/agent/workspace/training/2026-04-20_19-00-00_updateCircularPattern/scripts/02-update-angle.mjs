export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateCPAngle' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 30,
    xPosition: 50, yPosition: 0, zPosition: 0,
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
    angle: 1.5708, // 90°
    count: 4,
  })).result

  await snapshot('before-angle-update')

  // Update angle from 90° to 45°
  await api.v1.part.openFeature({ id: cpId })
  const r = await api.v1.part.updateCircularPattern({
    id: cpId,
    angle: 0.7854, // 45°
  })
  await api.v1.part.closeFeature({ id: cpId })
  console.log('[02] update angle result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-angle-45deg')

  return { partId, cpId }
}
