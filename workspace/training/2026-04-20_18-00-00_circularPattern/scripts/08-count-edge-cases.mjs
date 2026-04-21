export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CountEdgeTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 25,
    xPosition: 50, yPosition: 0, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  // count=1 — should create pattern feature but no copies
  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_count1',
    targets: [boxId],
    references: [waZ],
    angle: 1.0,
    count: 1,
  })
  console.log('[08] count=1: result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    console.log('[08] count=1 messages:', JSON.stringify(r1.messages.map(m => ({ msg: m.message, code: m.code }))))
  }

  await snapshot('count1')

  return { partId }
}
