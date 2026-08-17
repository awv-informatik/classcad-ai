export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const extId = (await api.v1.part.extrusion({
    id: partId, references: [regionId], limit2: 50,
  })).result
  console.log('[09] extId:', extId)

  // Try updateExtrusion WITHOUT openFeature
  const r = await api.v1.part.updateExtrusion({ id: extId, limit2: 100 })
  console.log('[09] no-open result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-open-response')

  // Try with wrong ID (part ID instead of feature ID)
  await api.v1.part.openFeature({ id: extId })
  const r2 = await api.v1.part.updateExtrusion({ id: partId, limit2: 100 })
  console.log('[09] wrong-id result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'wrong-id-response')
  await api.v1.part.closeFeature({ id: extId })

  return { partId, extId }
}
