export default async function (api, { snapshot, filewrite }) {
  // What happens when the profile touches or crosses the revolve axis?
  const partId = (await api.v1.part.create({ name: 'AxisCross' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  // Profile that TOUCHES the axis (starts at x=0)
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const r1 = await api.v1.part.revolve({
    id: partId,
    name: 'TouchAxis',
    references: [regionId],
    axisIds: [yAxisId]
  })
  console.log('[11] touch axis:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))
  if (r1.result) await snapshot('touch-axis')

  // Profile that CROSSES the axis (extends to negative X)
  const partId2 = (await api.v1.part.create({ name: 'CrossAxis' })).result
  const topId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'Top' })).result
  const yAxisId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'YAxis' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2, planeId: topId2 })).result
  const rectIds2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [-10, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rectIds2 })).result

  const r2 = await api.v1.part.revolve({
    id: partId2,
    name: 'CrossAxis',
    references: [regionId2],
    axisIds: [yAxisId2]
  })
  console.log('[11] cross axis:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))
  if (r2.result) await snapshot('cross-axis')

  filewrite({
    touchAxis: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    crossAxis: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'axis-crossing')

  return { partId }
}
