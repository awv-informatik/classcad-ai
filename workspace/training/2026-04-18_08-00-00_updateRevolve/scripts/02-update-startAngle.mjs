export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateStartAngle' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create half revolve (0 to PI)
  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId],
    startAngle: 0, endAngle: Math.PI
  })).result
  console.log('[02] revolve created:', revId)
  await snapshot('before-half')

  // Update startAngle to PI/4 (45°), keep endAngle at PI
  await api.v1.part.openFeature({ id: revId })
  const r = await api.v1.part.updateRevolve({ id: revId, startAngle: Math.PI / 4 })
  console.log('[02] update startAngle result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'startAngle-response')
  await api.v1.part.closeFeature({ id: revId })

  await snapshot('after-startAngle')
  return { partId, revId }
}
