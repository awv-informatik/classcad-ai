export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvertedTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Half revolve CCW (default, inverted=FALSE)
  const r1 = await api.v1.part.revolve({
    id: partId,
    name: 'NormalHalf',
    references: [regionId],
    axisIds: [yAxisId],
    endAngle: Math.PI
  })
  console.log('[05] normal half:', r1.result, 'maxLevel:', r1.maxLevel)
  await snapshot('normal-half')

  // Clear and redo with inverted=TRUE
  // Need a fresh part since we can't easily remove the feature
  const partId2 = (await api.v1.part.create({ name: 'InvertedTest2' })).result
  const topId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'Top' })).result
  const yAxisId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'YAxis' })).result

  const skId2 = (await api.v1.sketch.create({ id: partId2, planeId: topId2 })).result
  const rectIds2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rectIds2 })).result

  const r2 = await api.v1.part.revolve({
    id: partId2,
    name: 'InvertedHalf',
    references: [regionId2],
    axisIds: [yAxisId2],
    endAngle: Math.PI,
    inverted: 'TRUE'
  })
  console.log('[05] inverted half:', r2.result, 'maxLevel:', r2.maxLevel)
  await snapshot('inverted-half')

  filewrite({
    normal: { result: r1.result, maxLevel: r1.maxLevel },
    inverted: { result: r2.result, maxLevel: r2.maxLevel }
  }, 'inverted-comparison')

  return { partId, partId2 }
}
