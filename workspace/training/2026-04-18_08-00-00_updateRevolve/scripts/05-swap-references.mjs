export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SwapRefs' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  // Sketch with two regions: rectangle and circle
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionRect = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const circleId = (await api.v1.sketch.circle({
    id: skId, centerPos: [30, 15, 0], radius: 8
  })).result
  const regionCircle = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circleId] })).result

  console.log('[05] regionRect:', regionRect, 'regionCircle:', regionCircle)

  // Create revolve with rectangle profile
  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionRect], axisIds: [yAxisId],
    endAngle: Math.PI
  })).result
  console.log('[05] revolve with rect:', revId)
  await snapshot('before-rect')

  // Swap references to circle profile
  await api.v1.part.openFeature({ id: revId })
  const r = await api.v1.part.updateRevolve({ id: revId, references: [regionCircle] })
  console.log('[05] swap refs result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'swap-refs-response')
  await api.v1.part.closeFeature({ id: revId })

  await snapshot('after-circle')
  return { partId, revId }
}
