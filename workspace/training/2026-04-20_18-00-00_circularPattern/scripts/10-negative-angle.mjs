export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegAngleTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 30,
    xPosition: 50, yPosition: 0, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  // Negative angle — does it go clockwise instead of CCW?
  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_negangle',
    targets: [boxId],
    references: [waZ],
    angle: -1.0472, // -60 degrees
    count: 3,
  })
  console.log('[10] negative angle: result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    console.log('[10] messages:', JSON.stringify(r1.messages.map(m => ({ msg: m.message, code: m.code }))))
  }

  await snapshot('neg-angle')

  return { partId }
}
