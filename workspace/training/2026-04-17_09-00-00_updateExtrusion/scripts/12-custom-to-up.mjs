export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Start as CUSTOM with diagonal direction
  const extId = (await api.v1.part.extrusion({
    id: partId, references: [regionId], type: 'CUSTOM', direction: [1, 0, 1], limit1: 10, limit2: 60,
  })).result

  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 10, width: 10, height: 10 })).result

  await snapshot('before-custom')

  // Change back to UP — what happens to direction/limit1?
  await api.v1.part.openFeature({ id: extId })
  const r = await api.v1.part.updateExtrusion({ id: extId, type: 'UP' })
  console.log('[12] CUSTOM→UP:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'custom-to-up-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-up')

  // Now go back to CUSTOM — does it remember direction/limit1?
  await api.v1.part.openFeature({ id: extId })
  const r2 = await api.v1.part.updateExtrusion({ id: extId, type: 'CUSTOM' })
  console.log('[12] UP→CUSTOM (no dir):', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'up-to-custom-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-custom-again')

  return { partId, extId }
}
