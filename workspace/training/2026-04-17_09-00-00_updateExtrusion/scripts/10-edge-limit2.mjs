export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const extId = (await api.v1.part.extrusion({
    id: partId, references: [regionId], type: 'UP', limit2: 50,
  })).result
  console.log('[10] extId:', extId)

  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 10, width: 10, height: 10 })).result

  // Update limit2 to 0
  await api.v1.part.openFeature({ id: extId })
  const r1 = await api.v1.part.updateExtrusion({ id: extId, limit2: 0 })
  console.log('[10] limit2=0:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'limit2-zero-response')
  await api.v1.part.closeFeature({ id: extId })

  // Update limit2 to negative (should reverse direction per extrusion.md)
  await api.v1.part.openFeature({ id: extId })
  const r2 = await api.v1.part.updateExtrusion({ id: extId, limit2: -30 })
  console.log('[10] limit2=-30:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'limit2-neg-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-neg-limit2')

  // Update limit2 to very large value
  await api.v1.part.openFeature({ id: extId })
  const r3 = await api.v1.part.updateExtrusion({ id: extId, limit2: 10000 })
  console.log('[10] limit2=10000:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'limit2-large-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-large-limit2')

  return { partId, extId }
}
