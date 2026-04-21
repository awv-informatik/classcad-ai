export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateCount' })).result

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
  console.log('[09] lpId:', lpId)

  await snapshot('before-update')

  // Open → update count → close
  await api.v1.part.openFeature({ id: lpId })
  const r = await api.v1.part.updateLinearPattern({
    id: lpId,
    dir1: { count: 6 },
  })
  console.log('[09] update result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-count-response')
  await api.v1.part.closeFeature({ id: lpId })

  await snapshot('after-update-count6')

  return { partId, lpId }
}
