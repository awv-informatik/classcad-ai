export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateCPCount' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 30,
    xPosition: 50, yPosition: 0, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  // Create pattern with 3 copies at 90°
  const cpId = (await api.v1.part.circularPattern({
    id: partId,
    name: 'CP1',
    targets: [boxId],
    references: [waZ],
    angle: 1.5708,
    count: 3,
  })).result
  console.log('[01] cpId:', cpId)

  await snapshot('before-update')

  // Update count from 3 to 6
  await api.v1.part.openFeature({ id: cpId })
  const r = await api.v1.part.updateCircularPattern({
    id: cpId,
    count: 6,
  })
  await api.v1.part.closeFeature({ id: cpId })
  console.log('[01] update count result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-update-count6')

  return { partId, cpId }
}
