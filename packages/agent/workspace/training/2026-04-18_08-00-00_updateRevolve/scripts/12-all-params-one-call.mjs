export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AllParams' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result
  const xAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionRect = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const circleId = (await api.v1.sketch.circle({
    id: skId, centerPos: [30, 15, 0], radius: 8
  })).result
  const regionCircle = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circleId] })).result

  // Create basic revolve
  const revId = (await api.v1.part.revolve({
    id: partId, name: 'Original', references: [regionRect], axisIds: [yAxisId]
  })).result
  console.log('[12] original revolve:', revId)
  await snapshot('before')

  // Update ALL params in one call
  await api.v1.part.openFeature({ id: revId })
  const r = await api.v1.part.updateRevolve({
    id: revId,
    name: 'AllChanged',
    references: [regionCircle],
    axisIds: [xAxisId],
    startAngle: Math.PI / 6,
    endAngle: Math.PI,
    inverted: 1
  })
  console.log('[12] all-params result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'all-params-response')
  await api.v1.part.closeFeature({ id: revId })

  await snapshot('after-all-changed')
  return { partId, revId }
}
