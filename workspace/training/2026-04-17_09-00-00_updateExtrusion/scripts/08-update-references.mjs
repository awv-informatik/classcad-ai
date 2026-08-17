export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // Create sketch with TWO profiles
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result

  // Profile 1: rectangle
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const region1 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  console.log('[08] region1 (rect):', region1)

  // Profile 2: circle (separate, non-overlapping)
  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [120, 25, 0], radius: 20 })).result
  const region2 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circleId] })).result
  console.log('[08] region2 (circle):', region2)

  // Create extrusion with rectangle profile
  const extId = (await api.v1.part.extrusion({
    id: partId, references: [region1], limit2: 50,
  })).result
  console.log('[08] extId:', extId)

  await snapshot('before-rect-profile')

  // Update references to circle profile
  await api.v1.part.openFeature({ id: extId })
  const r = await api.v1.part.updateExtrusion({ id: extId, references: [region2] })
  console.log('[08] update refs to circle:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'refs-circle-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-circle-profile')

  // Update references to BOTH profiles
  await api.v1.part.openFeature({ id: extId })
  const r2 = await api.v1.part.updateExtrusion({ id: extId, references: [region1, region2] })
  console.log('[08] update refs to both:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'refs-both-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-both-profiles')

  return { partId, extId }
}
