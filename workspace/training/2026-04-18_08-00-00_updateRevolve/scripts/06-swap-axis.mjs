export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SwapAxis' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result
  const xAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 5, 0], endPos: [40, 25, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Revolve around Y axis
  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId],
    endAngle: Math.PI / 2
  })).result
  console.log('[06] revolve around Y:', revId)
  await snapshot('before-yaxis')

  // Swap axis to X axis
  await api.v1.part.openFeature({ id: revId })
  const r = await api.v1.part.updateRevolve({ id: revId, axisIds: [xAxisId] })
  console.log('[06] swap axis result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'swap-axis-response')
  await api.v1.part.closeFeature({ id: revId })

  await snapshot('after-xaxis')
  return { partId, revId }
}
