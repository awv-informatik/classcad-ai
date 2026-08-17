export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoOpenRot' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 15, height: 20,
    xPosition: 20, yPosition: 0, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  const rId = (await api.v1.part.rotation({
    id: partId,
    targets: [boxId],
    references: [waZ],
    angle: 0.5236,
  })).result

  // Without openFeature
  const r = await api.v1.part.updateRotation({ id: rId, angle: 1.5708 })
  console.log('[02] no-open result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) {
    filewrite({ messages: r.messages }, 'no-open-msgs')
  }

  return { partId }
}
