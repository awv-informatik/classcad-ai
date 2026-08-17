export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AngleTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // startAngle=PI/4, endAngle=3*PI/4 — a 90-degree arc starting 45 degrees in
  const r1 = await api.v1.part.revolve({
    id: partId,
    name: 'OffsetArc',
    references: [regionId],
    axisIds: [yAxisId],
    startAngle: Math.PI / 4,
    endAngle: 3 * Math.PI / 4
  })
  console.log('[03] offset arc:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'offset-arc-response')
  await snapshot('offset-arc')

  return { partId }
}
