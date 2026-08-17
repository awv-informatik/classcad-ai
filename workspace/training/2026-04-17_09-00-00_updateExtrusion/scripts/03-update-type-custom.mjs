export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create UP extrusion
  const extId = (await api.v1.part.extrusion({
    id: partId, references: [regionId], type: 'UP', limit2: 50,
  })).result

  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 10, width: 10, height: 10 })).result

  await snapshot('before-up')

  // Update to CUSTOM with direction and limit1/limit2 in one call
  await api.v1.part.openFeature({ id: extId })
  const r = await api.v1.part.updateExtrusion({
    id: extId,
    type: 'CUSTOM',
    direction: [1, 0, 1],
    limit1: 0,
    limit2: 80,
  })
  console.log('[03] update to CUSTOM:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'custom-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-custom')

  // Now update direction only (keep CUSTOM type)
  await api.v1.part.openFeature({ id: extId })
  const r2 = await api.v1.part.updateExtrusion({
    id: extId,
    direction: [0, 1, 1],
  })
  console.log('[03] update direction only:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'direction-only-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-direction-change')

  // Now update limit1 (start offset)
  await api.v1.part.openFeature({ id: extId })
  const r3 = await api.v1.part.updateExtrusion({
    id: extId,
    limit1: 20,
  })
  console.log('[03] update limit1=20:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'limit1-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-limit1')

  return { partId, extId }
}
