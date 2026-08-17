export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateAddDir2' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 15, width: 15, height: 20,
  })).result

  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result
  const waY = (await api.v1.part.workAxis({
    id: partId, name: 'AxisY',
    origin: [0, 0, 0], direction: [0, 1, 0],
  })).result

  // Start with 1D pattern
  const lpId = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [boxId],
    dir1: { references: [waX], distance: 30, count: 3 },
  })).result

  await snapshot('before-add-dir2')

  // Add dir2 via update
  await api.v1.part.openFeature({ id: lpId })
  const r = await api.v1.part.updateLinearPattern({
    id: lpId,
    dir2: { references: [waY], distance: 30, count: 3 },
  })
  console.log('[11] add dir2 result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'add-dir2-response')
  await api.v1.part.closeFeature({ id: lpId })

  await snapshot('after-add-dir2')

  return { partId, lpId }
}
