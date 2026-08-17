export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CountAngleTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 30,
    xPosition: 50, yPosition: 0, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  // Test angle=0 — what does it mean? Equal spacing around full circle?
  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_angle0',
    targets: [boxId],
    references: [waZ],
    angle: 0,
    count: 6,
  })
  console.log('[02] angle=0 count=6: result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    console.log('[02] messages:', JSON.stringify(r1.messages.map(m => ({ msg: m.message, code: m.code, level: m.level }))))
  }

  await snapshot('angle0-count6')

  return { partId }
}
