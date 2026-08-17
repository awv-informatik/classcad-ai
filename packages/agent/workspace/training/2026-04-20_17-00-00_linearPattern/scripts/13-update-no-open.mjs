export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateNoOpen' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 25,
  })).result

  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'Axis',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  const lpId = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [boxId],
    dir1: { references: [waId], distance: 40, count: 3 },
  })).result

  // Try update WITHOUT openFeature
  const r = await api.v1.part.updateLinearPattern({
    id: lpId,
    dir1: { count: 6 },
  })
  console.log('[13] update without open result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-open-response')

  return { partId }
}
