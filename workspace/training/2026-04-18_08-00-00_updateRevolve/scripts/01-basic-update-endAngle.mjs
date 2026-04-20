export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateRevolveTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create full revolve
  const revId = (await api.v1.part.revolve({
    id: partId, name: 'Rev1', references: [regionId], axisIds: [yAxisId]
  })).result
  console.log('[01] revolve created:', revId)

  await snapshot('before')
  filewrite({ revId }, 'before-state')

  // Update: change from full 360 to quarter turn
  await api.v1.part.openFeature({ id: revId })
  const r = await api.v1.part.updateRevolve({ id: revId, endAngle: Math.PI / 2 })
  console.log('[01] updateRevolve result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-response')
  await api.v1.part.closeFeature({ id: revId })

  await snapshot('after-quarter')

  return { partId, revId }
}
