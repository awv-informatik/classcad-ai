export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateType' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-25, -15, 0], endPos: [25, 15, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const twistId = (await api.v1.part.twist({
    id: partId, name: 'TypeTest', references: [regionId],
    type: 'UP', twistAngle: Math.PI / 2, limit2: 80,
  })).result
  console.log('[11] created UP twist:', twistId)
  await snapshot('up-type')

  // Change type to SYMMETRIC
  await api.v1.part.openFeature({ id: twistId })
  const r1 = await api.v1.part.updateTwist({ id: twistId, type: 'SYMMETRIC' })
  await api.v1.part.closeFeature({ id: twistId })
  console.log('[11] changed to SYMMETRIC:', r1.result, 'maxLevel:', r1.maxLevel)
  await snapshot('symmetric-type')

  // Change capEnds to 0 (sheet)
  await api.v1.part.openFeature({ id: twistId })
  const r2 = await api.v1.part.updateTwist({ id: twistId, capEnds: 0 })
  await api.v1.part.closeFeature({ id: twistId })
  console.log('[11] capEnds=0:', r2.result, 'maxLevel:', r2.maxLevel)
  await snapshot('sheet-type')

  filewrite({
    symmetric: { id: r1.result, maxLevel: r1.maxLevel, msgs: r1.messages },
    sheet: { id: r2.result, maxLevel: r2.maxLevel, msgs: r2.messages },
  }, 'update-type-response')

  return { partId }
}
