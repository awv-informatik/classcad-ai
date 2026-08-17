export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TwoDirections' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 15, width: 15, height: 20,
  })).result

  // Work axis along X
  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // Work axis along Y
  const waY = (await api.v1.part.workAxis({
    id: partId, name: 'AxisY',
    origin: [0, 0, 0], direction: [0, 1, 0],
  })).result

  // 2D grid: 4 along X, 3 along Y
  const r = await api.v1.part.linearPattern({
    id: partId,
    name: 'LP_grid',
    targets: [boxId],
    dir1: { references: [waX], distance: 30, count: 4 },
    dir2: { references: [waY], distance: 30, count: 3 },
  })

  console.log('[05] grid pattern result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'grid-response')
  await snapshot('grid-pattern')

  return { partId, lpId: r.result }
}
