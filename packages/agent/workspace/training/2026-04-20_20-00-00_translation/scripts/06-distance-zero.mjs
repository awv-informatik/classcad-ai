export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TransZero' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 25,
  })).result

  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // distance=0 — does it create the feature but do nothing?
  const r = await api.v1.part.translation({
    id: partId,
    name: 'TransZero',
    targets: [boxId],
    references: [waX],
    distance: 0,
  })
  console.log('[06] distance=0: result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) {
    filewrite({ messages: r.messages }, 'zero-dist-msgs')
  }

  await snapshot('zero-distance')

  return { partId }
}
