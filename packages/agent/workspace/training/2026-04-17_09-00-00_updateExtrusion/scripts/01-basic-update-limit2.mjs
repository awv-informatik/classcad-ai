export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create extrusion with limit2=30
  const extId = (await api.v1.part.extrusion({
    id: partId, name: 'Ext1', references: [regionId], type: 'UP', limit2: 30,
  })).result
  console.log('[01] extrusion created:', extId)

  // Add a reference box so size changes are visible
  const refBoxId = (await api.v1.part.box({ id: partId, name: 'RefBox', length: 10, width: 10, height: 10, references: [topId] })).result
  console.log('[01] refBox:', refBoxId)

  await snapshot('before')
  filewrite({ extId, limit2Before: 30 }, 'before-data')

  // open → update → close
  const openR = await api.v1.part.openFeature({ id: extId })
  console.log('[01] openFeature maxLevel:', openR.maxLevel)

  const updateR = await api.v1.part.updateExtrusion({ id: extId, limit2: 100 })
  console.log('[01] updateExtrusion result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-response')

  const closeR = await api.v1.part.closeFeature({ id: extId })
  console.log('[01] closeFeature maxLevel:', closeR.maxLevel)

  await snapshot('after')
  filewrite({ extId, limit2After: 100 }, 'after-data')

  return { partId, extId }
}
