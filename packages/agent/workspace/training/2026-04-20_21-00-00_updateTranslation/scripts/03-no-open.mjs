export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoOpenTrans' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 25,
  })).result

  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  const tId = (await api.v1.part.translation({
    id: partId,
    targets: [boxId],
    references: [waX],
    distance: 30,
  })).result

  // Try without openFeature
  const r = await api.v1.part.updateTranslation({ id: tId, distance: 60 })
  console.log('[03] no-open result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) {
    filewrite({ messages: r.messages }, 'no-open-msgs')
  }

  return { partId }
}
