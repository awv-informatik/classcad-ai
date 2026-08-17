export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateCPTargets' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 30,
    xPosition: 50, yPosition: 0, zPosition: 0,
  })).result

  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl1',
    height: 40, diameter: 10,
    xPosition: 50, yPosition: 20, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  // Pattern with just the box
  const cpId = (await api.v1.part.circularPattern({
    id: partId,
    name: 'CP1',
    targets: [boxId],
    references: [waZ],
    angle: 1.5708,
    count: 4,
  })).result

  await snapshot('before-target-update')

  // Update targets to include both box and cylinder
  await api.v1.part.openFeature({ id: cpId })
  const r = await api.v1.part.updateCircularPattern({
    id: cpId,
    targets: [boxId, cylId],
  })
  await api.v1.part.closeFeature({ id: cpId })
  console.log('[06] update targets result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) {
    filewrite({ messages: r.messages }, 'update-targets-msgs')
  }

  await snapshot('after-target-update')

  return { partId, cpId }
}
