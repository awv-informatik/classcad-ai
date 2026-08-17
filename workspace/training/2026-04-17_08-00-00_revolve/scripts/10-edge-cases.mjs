export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCases' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Test 1: zero endAngle
  const r1 = await api.v1.part.revolve({
    id: partId,
    name: 'ZeroAngle',
    references: [regionId],
    axisIds: [yAxisId],
    endAngle: 0
  })
  console.log('[10] zero angle:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  // Test 2: negative endAngle
  const partId2 = (await api.v1.part.create({ name: 'NegAngle' })).result
  const topId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'Top' })).result
  const yAxisId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'YAxis' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2, planeId: topId2 })).result
  const rectIds2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rectIds2 })).result

  const r2 = await api.v1.part.revolve({
    id: partId2,
    name: 'NegAngle',
    references: [regionId2],
    axisIds: [yAxisId2],
    endAngle: -Math.PI / 2
  })
  console.log('[10] neg angle:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  // Test 3: startAngle > endAngle
  const partId3 = (await api.v1.part.create({ name: 'StartGtEnd' })).result
  const topId3 = (await api.v1.part.getWorkGeometry({ id: partId3, name: 'Top' })).result
  const yAxisId3 = (await api.v1.part.getWorkGeometry({ id: partId3, name: 'YAxis' })).result
  const skId3 = (await api.v1.sketch.create({ id: partId3, planeId: topId3 })).result
  const rectIds3 = (await api.v1.sketch.rectangle({
    id: skId3, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId3 = (await api.v1.sketch.sketchRegion({ id: skId3, geomIds: rectIds3 })).result

  const r3 = await api.v1.part.revolve({
    id: partId3,
    name: 'StartGtEnd',
    references: [regionId3],
    axisIds: [yAxisId3],
    startAngle: Math.PI,
    endAngle: Math.PI / 2
  })
  console.log('[10] start>end:', r3.result, 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  // Test 4: same start and end angle
  const partId4 = (await api.v1.part.create({ name: 'SameAngle' })).result
  const topId4 = (await api.v1.part.getWorkGeometry({ id: partId4, name: 'Top' })).result
  const yAxisId4 = (await api.v1.part.getWorkGeometry({ id: partId4, name: 'YAxis' })).result
  const skId4 = (await api.v1.sketch.create({ id: partId4, planeId: topId4 })).result
  const rectIds4 = (await api.v1.sketch.rectangle({
    id: skId4, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId4 = (await api.v1.sketch.sketchRegion({ id: skId4, geomIds: rectIds4 })).result

  const r4 = await api.v1.part.revolve({
    id: partId4,
    name: 'SameAngle',
    references: [regionId4],
    axisIds: [yAxisId4],
    startAngle: Math.PI / 2,
    endAngle: Math.PI / 2
  })
  console.log('[10] same angle:', r4.result, 'maxLevel:', r4.maxLevel, 'msgs:', JSON.stringify(r4.messages))

  filewrite({
    zeroAngle: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    negAngle: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    startGtEnd: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    sameAngle: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }
  }, 'edge-cases')

  if (r2.result) await snapshot('neg-angle')
  if (r3.result) await snapshot('start-gt-end')

  return { partId }
}
