export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoOpenFeature' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId],
    endAngle: Math.PI
  })).result
  console.log('[09] revolve created:', revId)

  // Try to update WITHOUT openFeature
  const r = await api.v1.part.updateRevolve({ id: revId, endAngle: Math.PI / 2 })
  console.log('[09] no-open result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-open-response')

  return { partId, revId }
}
