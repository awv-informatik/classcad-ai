export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TwoRev' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  // First sketch + region
  const skId1 = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rect1 = (await api.v1.sketch.rectangle({
    id: skId1, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const reg1 = (await api.v1.sketch.sketchRegion({ id: skId1, geomIds: rect1 })).result

  const r1 = await api.v1.part.revolve({
    id: partId,
    name: 'Rev1',
    references: [reg1],
    axisIds: [yAxisId],
    endAngle: Math.PI
  })
  console.log('[17] first revolve same part:', r1.result, 'maxLevel:', r1.maxLevel)

  // Second sketch + region in the same part
  const skId2 = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rect2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [50, 0, 0], endPos: [70, 20, 0]
  })).result
  const reg2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rect2 })).result

  const r2 = await api.v1.part.revolve({
    id: partId,
    name: 'Rev2',
    references: [reg2],
    axisIds: [yAxisId],
    endAngle: Math.PI / 2
  })
  console.log('[17] second revolve same part:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[17] msgs:', JSON.stringify(r2.messages))

  filewrite({
    first: { result: r1.result, maxLevel: r1.maxLevel },
    second: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'same-part-results')

  if (r2.result) await snapshot('two-revolves')

  return { partId }
}
