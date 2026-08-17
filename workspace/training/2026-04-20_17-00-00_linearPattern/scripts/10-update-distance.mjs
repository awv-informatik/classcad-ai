export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateDist' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 25,
  })).result

  // Add a reference cylinder that won't be patterned
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    height: 5, diameter: 10,
  })).result

  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'Axis',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  const lpId = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [boxId],
    dir1: { references: [waId], distance: 30, count: 4 },
  })).result

  await snapshot('before-distance-update')

  // Update distance from 30 to 60
  await api.v1.part.openFeature({ id: lpId })
  const r = await api.v1.part.updateLinearPattern({
    id: lpId,
    dir1: { distance: 60 },
  })
  console.log('[10] update distance result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-distance-response')
  await api.v1.part.closeFeature({ id: lpId })

  await snapshot('after-distance-update')

  return { partId, lpId }
}
