export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CountTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 25,
  })).result

  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'Axis',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // count=1 — should that produce just the original, no copies?
  const r1 = await api.v1.part.linearPattern({
    id: partId, name: 'LP_count1',
    targets: [boxId],
    dir1: { references: [waId], distance: 40, count: 1 },
  })
  console.log('[02] count=1 result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'count1-response')
  await snapshot('count1')

  // count=0
  const partId2 = (await api.v1.part.create({ name: 'CountZero' })).result
  const boxId2 = (await api.v1.part.box({
    id: partId2, name: 'Box2',
    length: 20, width: 15, height: 25,
  })).result
  const waId2 = (await api.v1.part.workAxis({
    id: partId2, name: 'Axis2',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  const r0 = await api.v1.part.linearPattern({
    id: partId2, name: 'LP_count0',
    targets: [boxId2],
    dir1: { references: [waId2], distance: 40, count: 0 },
  })
  console.log('[02] count=0 result:', r0.result, 'maxLevel:', r0.maxLevel)
  filewrite({ result: r0.result, messages: r0.messages, maxLevel: r0.maxLevel }, 'count0-response')
  await snapshot('count0')

  return { partId }
}
