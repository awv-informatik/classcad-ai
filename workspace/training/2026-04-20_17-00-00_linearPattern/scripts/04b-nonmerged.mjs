export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonMergedTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 25,
  })).result

  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'Axis',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // Non-merged with same overlapping distance for comparison
  const r = await api.v1.part.linearPattern({
    id: partId, name: 'LP_nonmerged',
    targets: [boxId],
    dir1: { references: [waId], distance: 15, count: 4, merged: 0 },
  })
  console.log('[04b] non-merged result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04b] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'nonmerged-response')
  await snapshot('nonmerged-overlapping')

  return { partId, lpId: r.result }
}
