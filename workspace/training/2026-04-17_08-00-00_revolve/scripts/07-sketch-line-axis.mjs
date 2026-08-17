export default async function (api, { snapshot, filewrite }) {
  // Use a sketch line as the revolve axis instead of a work axis
  const partId = (await api.v1.part.create({ name: 'SkLineAxis' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result

  // Draw a profile to revolve (L-shaped)
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 30, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [40, 30, 0], endPos: [20, 30, 0] })).result
  const l4 = (await api.v1.sketch.line({ id: skId, startPos: [20, 30, 0], endPos: [20, 0, 0] })).result

  // Draw a separate line along Y axis to use as revolve axis
  const axisLine = (await api.v1.sketch.line({ id: skId, startPos: [0, -10, 0], endPos: [0, 40, 0] })).result

  console.log('[07] profile lines:', l1, l2, l3, l4)
  console.log('[07] axis line:', axisLine)

  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [l1, l2, l3, l4] })).result
  console.log('[07] regionId:', regionId)

  // Revolve around the sketch line
  const r = await api.v1.part.revolve({
    id: partId,
    name: 'SkLineRevolve',
    references: [regionId],
    axisIds: [axisLine],
    endAngle: Math.PI
  })
  console.log('[07] sketch line axis revolve:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'sketch-line-axis-response')

  if (r.result) await snapshot('sketch-line-axis')

  return { partId }
}
