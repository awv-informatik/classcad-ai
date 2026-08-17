export default async function (api, { snapshot, filewrite }) {
  // Test inverted with different boolean representations
  const partId = (await api.v1.part.create({ name: 'InvertFix' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Try integer 1
  const r1 = await api.v1.part.revolve({
    id: partId,
    name: 'InvInt',
    references: [regionId],
    axisIds: [yAxisId],
    endAngle: Math.PI,
    inverted: 1
  })
  console.log('[06] inverted=1:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  // Try JS boolean true (new part to avoid interference)
  const partId2 = (await api.v1.part.create({ name: 'InvertBool' })).result
  const topId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'Top' })).result
  const yAxisId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'YAxis' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2, planeId: topId2 })).result
  const rectIds2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rectIds2 })).result

  const r2 = await api.v1.part.revolve({
    id: partId2,
    name: 'InvBool',
    references: [regionId2],
    axisIds: [yAxisId2],
    endAngle: Math.PI,
    inverted: true
  })
  console.log('[06] inverted=true:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  filewrite({
    int1: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    boolTrue: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'inverted-variants')

  // Snapshot the one(s) that worked
  if (r1.result) await snapshot('inverted-int')
  if (r2.result) await snapshot('inverted-bool')

  return { partId, partId2 }
}
