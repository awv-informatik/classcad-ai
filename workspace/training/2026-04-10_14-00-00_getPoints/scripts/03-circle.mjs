// getPoints on a circle — expects { centerId }
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({
    id: skId,
    centerPos: [40, 30, 0],
    radius: 25
  })).result
  console.log('[03] circleId:', circleId)

  const r = await api.v1.sketch.getPoints({ id: circleId })
  console.log('[03] getPoints result:', JSON.stringify(r.result))
  console.log('[03] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'circle-getPoints')

  await snapshot('circle')
  return { partId }
}
