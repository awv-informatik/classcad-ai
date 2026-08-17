export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateCPRefs' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 30,
    xPosition: 50, yPosition: 0, zPosition: 0,
  })).result

  // Two work axes — Z and X
  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // Pattern around Z first
  const cpId = (await api.v1.part.circularPattern({
    id: partId,
    name: 'CP1',
    targets: [boxId],
    references: [waZ],
    angle: 1.5708,
    count: 3,
  })).result

  await snapshot('around-z')

  // Update to rotate around X instead
  await api.v1.part.openFeature({ id: cpId })
  const r = await api.v1.part.updateCircularPattern({
    id: cpId,
    references: [waX],
  })
  await api.v1.part.closeFeature({ id: cpId })
  console.log('[05] update references result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) {
    filewrite({ messages: r.messages }, 'update-refs-msgs')
  }

  await snapshot('around-x')

  return { partId, cpId }
}
