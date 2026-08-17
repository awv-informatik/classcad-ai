export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTwist' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-30, -20, 0], endPos: [30, 20, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const twistId = (await api.v1.part.twist({
    id: partId, name: 'MyTwist', references: [regionId],
    twistAngle: Math.PI / 4, limit2: 80,
  })).result
  console.log('[10] created twist:', twistId)
  await snapshot('before-update')

  // Test updateTwist WITH openFeature/closeFeature
  await api.v1.part.openFeature({ id: twistId })
  const r1 = await api.v1.part.updateTwist({
    id: twistId,
    twistAngle: Math.PI,
    limit2: 120,
  })
  await api.v1.part.closeFeature({ id: twistId })
  console.log('[10] updateTwist result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'update-response')
  await snapshot('after-update')

  return { partId }
}
