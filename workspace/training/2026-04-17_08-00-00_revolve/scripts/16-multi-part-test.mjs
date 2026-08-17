export default async function (api, { snapshot, filewrite }) {
  // Test if two revolves in the same session both work with known-good params
  const partId = (await api.v1.part.create({ name: 'Multi1' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const r1 = await api.v1.part.revolve({
    id: partId,
    name: 'Rev1',
    references: [regionId],
    axisIds: [yAxisId],
    endAngle: Math.PI
  })
  console.log('[16] first revolve:', r1.result, 'maxLevel:', r1.maxLevel)

  // Second part with identical setup
  const partId2 = (await api.v1.part.create({ name: 'Multi2' })).result
  const topId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'Top' })).result
  const yAxisId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'YAxis' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2, planeId: topId2 })).result
  const rectIds2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rectIds2 })).result

  const r2 = await api.v1.part.revolve({
    id: partId2,
    name: 'Rev2',
    references: [regionId2],
    axisIds: [yAxisId2],
    endAngle: Math.PI / 2
  })
  console.log('[16] second revolve:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    first: { result: r1.result, maxLevel: r1.maxLevel },
    second: { result: r2.result, maxLevel: r2.maxLevel }
  }, 'multi-part-results')

  return { partId }
}
