export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RevolveTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  // Create sketch on Top plane — rectangle offset from Y axis
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  console.log('[01] partId:', partId, 'skId:', skId, 'regionId:', regionId, 'yAxisId:', yAxisId)

  // Full revolve (default 2*PI) around Y axis
  const r = await api.v1.part.revolve({
    id: partId,
    name: 'FullRevolve',
    references: [regionId],
    axisIds: [yAxisId]
  })

  console.log('[01] revolve result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'full-revolve-response')

  await snapshot('full-revolve')
  return { partId }
}
