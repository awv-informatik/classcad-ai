export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ParamPersist' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create revolve with specific params
  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId],
    startAngle: Math.PI / 4, endAngle: Math.PI, inverted: 1
  })).result
  console.log('[13] revolve created with startAngle=PI/4, endAngle=PI, inverted=1')
  await snapshot('initial')

  // Update ONLY endAngle — startAngle and inverted should persist
  await api.v1.part.openFeature({ id: revId })
  const r1 = await api.v1.part.updateRevolve({ id: revId, endAngle: 3 * Math.PI / 2 })
  console.log('[13] update endAngle only:', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: revId })
  await snapshot('after-endAngle-only')

  // Update ONLY inverted — startAngle and new endAngle should persist
  await api.v1.part.openFeature({ id: revId })
  const r2 = await api.v1.part.updateRevolve({ id: revId, inverted: 0 })
  console.log('[13] update inverted only:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: revId })
  await snapshot('after-inverted-only')

  return { partId, revId }
}
