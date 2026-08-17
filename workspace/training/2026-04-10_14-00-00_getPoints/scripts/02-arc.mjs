// getPoints on an arc — expects { startId, endId, centerId }
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId,
    centerPos: [40, 30, 0],
    startPos: [70, 30, 0],
    endPos: [40, 60, 0]
  })).result
  console.log('[02] arcId:', arcId)

  const r = await api.v1.sketch.getPoints({ id: arcId })
  console.log('[02] getPoints result:', JSON.stringify(r.result))
  console.log('[02] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'arc-getPoints')

  await snapshot('arc')
  return { partId }
}
