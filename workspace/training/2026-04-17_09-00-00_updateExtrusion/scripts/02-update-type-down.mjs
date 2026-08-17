export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create extrusion UP with limit2=60
  const extId = (await api.v1.part.extrusion({
    id: partId, references: [regionId], type: 'UP', limit2: 60,
  })).result
  console.log('[02] extId:', extId)

  // Add a small reference box (no references param, just small dimensions)
  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 10, width: 10, height: 10 })).result
  console.log('[02] refBox:', refBoxId)

  await snapshot('before-up')

  // Update type from UP to DOWN
  await api.v1.part.openFeature({ id: extId })
  const r = await api.v1.part.updateExtrusion({ id: extId, type: 'DOWN' })
  console.log('[02] update to DOWN:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'down-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-down')

  // Now update to SYMMETRIC
  await api.v1.part.openFeature({ id: extId })
  const r2 = await api.v1.part.updateExtrusion({ id: extId, type: 'SYMMETRIC' })
  console.log('[02] update to SYMMETRIC:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'symmetric-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-symmetric')

  return { partId, extId }
}
