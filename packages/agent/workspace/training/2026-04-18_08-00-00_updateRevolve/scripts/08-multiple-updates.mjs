export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiUpdate' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create full revolve
  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId]
  })).result
  console.log('[08] revolve created:', revId)
  await snapshot('initial-full')

  // Multiple updates in one open/close session
  await api.v1.part.openFeature({ id: revId })

  const r1 = await api.v1.part.updateRevolve({ id: revId, endAngle: Math.PI })
  console.log('[08] update1 (half):', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.updateRevolve({ id: revId, startAngle: Math.PI / 4 })
  console.log('[08] update2 (start=45°):', r2.result, 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.part.updateRevolve({ id: revId, inverted: 1 })
  console.log('[08] update3 (inverted):', r3.result, 'maxLevel:', r3.maxLevel)

  await api.v1.part.closeFeature({ id: revId })

  await snapshot('after-cumulative')
  filewrite({
    update1: { result: r1.result, maxLevel: r1.maxLevel },
    update2: { result: r2.result, maxLevel: r2.maxLevel },
    update3: { result: r3.result, maxLevel: r3.maxLevel }
  }, 'multi-update-responses')

  return { partId, revId }
}
