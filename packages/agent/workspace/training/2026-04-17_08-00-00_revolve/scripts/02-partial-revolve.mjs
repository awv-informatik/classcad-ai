export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PartialRevolve' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // 90-degree revolve (PI/2)
  const r1 = await api.v1.part.revolve({
    id: partId,
    name: 'Quarter',
    references: [regionId],
    axisIds: [yAxisId],
    endAngle: Math.PI / 2
  })
  console.log('[02] quarter revolve:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'quarter-response')
  await snapshot('quarter')

  return { partId }
}
