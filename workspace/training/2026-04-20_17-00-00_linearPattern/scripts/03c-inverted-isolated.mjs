export default async function (api, { snapshot, filewrite }) {
  // Single part, single linearPattern — testing inverted=0 in isolation
  const partId = (await api.v1.part.create({ name: 'InvertedIsolated' })).result

  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [60, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 25,
    references: [wcs],
  })).result

  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'Axis',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // inverted=0 — should be same as default (not inverted)
  const r = await api.v1.part.linearPattern({
    id: partId, name: 'LP_notinverted',
    targets: [boxId],
    dir1: { references: [waId], distance: 40, count: 3, inverted: 0 },
  })
  console.log('[03c] inverted=0 result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03c] msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'inverted0-isolated')
  await snapshot('inverted0')

  return { partId, lpId: r.result }
}
