// getPositions on a circle — expects { centerPos }
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 30, 0], radius: 20 })).result
  console.log('[03] circleId:', circId)

  const r = await api.v1.sketch.getPositions({ id: circId })
  console.log('[03] getPositions result:', JSON.stringify(r.result))
  console.log('[03] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'circle-response')

  await snapshot('circle')
  return { partId }
}
