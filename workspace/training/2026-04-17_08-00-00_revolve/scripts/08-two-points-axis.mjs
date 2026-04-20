export default async function (api, { snapshot, filewrite }) {
  // Use two work points as the revolve axis
  const partId = (await api.v1.part.create({ name: 'TwoPointAxis' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create two work points to define the axis
  const wp1 = (await api.v1.part.workPoint({
    id: partId, name: 'AxisPt1', position: [0, 0, 0]
  })).result
  const wp2 = (await api.v1.part.workPoint({
    id: partId, name: 'AxisPt2', position: [0, 50, 0]
  })).result

  console.log('[08] workPoints:', wp1, wp2)

  // Revolve with two-point axis
  const r = await api.v1.part.revolve({
    id: partId,
    name: 'TwoPtRevolve',
    references: [regionId],
    axisIds: [wp1, wp2],
    endAngle: Math.PI
  })
  console.log('[08] two-point axis revolve:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'two-point-axis-response')

  if (r.result) await snapshot('two-point-axis')

  return { partId }
}
