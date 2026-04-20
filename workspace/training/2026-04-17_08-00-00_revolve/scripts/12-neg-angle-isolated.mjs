export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegAngle' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const r = await api.v1.part.revolve({
    id: partId,
    name: 'NegAngle',
    references: [regionId],
    axisIds: [yAxisId],
    endAngle: -Math.PI / 2
  })
  console.log('[12] neg angle:', r.result, 'maxLevel:', r.maxLevel, 'msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'neg-angle-response')
  if (r.result) await snapshot('neg-angle')
  return { partId }
}
