export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiTargets' })).result

  // Create two different features
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 15, width: 15, height: 25,
  })).result

  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [0, 30, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl1',
    height: 25, diameter: 12,
    references: [wcs],
  })).result

  console.log('[08] boxId:', boxId, 'cylId:', cylId)

  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'Axis',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  await snapshot('before-pattern')

  // Pattern both features together
  const r = await api.v1.part.linearPattern({
    id: partId,
    name: 'LP_multi',
    targets: [boxId, cylId],
    dir1: { references: [waId], distance: 40, count: 3 },
  })

  console.log('[08] multi-target result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-response')
  await snapshot('multi-target-pattern')

  return { partId, lpId: r.result }
}
