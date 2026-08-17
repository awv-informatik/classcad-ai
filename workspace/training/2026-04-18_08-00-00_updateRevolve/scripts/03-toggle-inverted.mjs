export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ToggleInverted' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create quarter revolve (0 to PI/2), default inverted=0 (CCW)
  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId],
    endAngle: Math.PI / 2
  })).result
  console.log('[03] revolve created:', revId)
  await snapshot('before-ccw')

  // Toggle to inverted=1 (CW)
  await api.v1.part.openFeature({ id: revId })
  const r = await api.v1.part.updateRevolve({ id: revId, inverted: 1 })
  console.log('[03] toggle inverted result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'inverted-response')
  await api.v1.part.closeFeature({ id: revId })

  await snapshot('after-cw')

  // Toggle back to inverted=0 (CCW)
  await api.v1.part.openFeature({ id: revId })
  const r2 = await api.v1.part.updateRevolve({ id: revId, inverted: 0 })
  console.log('[03] toggle back result:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: revId })

  await snapshot('after-back-ccw')
  return { partId, revId }
}
