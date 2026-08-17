export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WorkPointsDir' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 15, width: 15, height: 20,
  })).result

  // Two work points define a direction vector (from pt1 to pt2)
  const wp1 = (await api.v1.part.workPoint({
    id: partId, name: 'WP1', position: [0, 0, 0],
  })).result
  const wp2 = (await api.v1.part.workPoint({
    id: partId, name: 'WP2', position: [50, 30, 0],
  })).result

  console.log('[06] wp1:', wp1, 'wp2:', wp2)

  // Pattern using two work points as direction reference
  const r = await api.v1.part.linearPattern({
    id: partId,
    name: 'LP_points',
    targets: [boxId],
    dir1: { references: [wp1, wp2], distance: 40, count: 3 },
  })

  console.log('[06] workpoints result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'workpoints-response')
  await snapshot('workpoints-pattern')

  return { partId, lpId: r.result }
}
