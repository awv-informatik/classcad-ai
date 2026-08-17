export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateMerged' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 25,
  })).result

  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'Axis',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // Start non-merged with overlapping distance
  const lpId = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [boxId],
    dir1: { references: [waId], distance: 15, count: 4 },
  })).result

  await snapshot('before-merge')

  // Update to merged
  await api.v1.part.openFeature({ id: lpId })
  const r = await api.v1.part.updateLinearPattern({
    id: lpId,
    dir1: { merged: 1 },
  })
  console.log('[12] merge result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'merge-response')
  await api.v1.part.closeFeature({ id: lpId })

  await snapshot('after-merge')

  return { partId, lpId }
}
