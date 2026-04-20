export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongId' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId]
  })).result
  console.log('[10] revolve created:', revId)

  // Try updateRevolve with PART ID instead of feature ID
  await api.v1.part.openFeature({ id: revId })  // open correctly first
  const r1 = await api.v1.part.updateRevolve({ id: partId, endAngle: Math.PI / 2 })
  console.log('[10] partId result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] partId messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'wrong-partId-response')
  await api.v1.part.closeFeature({ id: revId })

  // Try updateRevolve with sketch ID
  await api.v1.part.openFeature({ id: revId })
  const r2 = await api.v1.part.updateRevolve({ id: skId, endAngle: Math.PI / 2 })
  console.log('[10] sketchId result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] sketchId messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'wrong-sketchId-response')
  await api.v1.part.closeFeature({ id: revId })

  return { partId, revId }
}
