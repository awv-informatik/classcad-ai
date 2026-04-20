export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create solid extrusion (capEnds=1, default)
  const extId = (await api.v1.part.extrusion({
    id: partId, references: [regionId], type: 'UP', limit2: 50, capEnds: 1,
  })).result
  console.log('[05] extId:', extId)

  await snapshot('before-solid')

  // Update to sheet (capEnds=0)
  await api.v1.part.openFeature({ id: extId })
  const r = await api.v1.part.updateExtrusion({ id: extId, capEnds: 0 })
  console.log('[05] capEnds=0:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'sheet-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-sheet')

  // Update back to solid (capEnds=1)
  await api.v1.part.openFeature({ id: extId })
  const r2 = await api.v1.part.updateExtrusion({ id: extId, capEnds: 1 })
  console.log('[05] capEnds=1:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'solid-again-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-solid-again')

  // Try string 'TRUE' — should fail based on extrusion.md findings
  await api.v1.part.openFeature({ id: extId })
  const r3 = await api.v1.part.updateExtrusion({ id: extId, capEnds: 'TRUE' })
  console.log('[05] capEnds=TRUE (string):', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'string-true-response')
  await api.v1.part.closeFeature({ id: extId })

  return { partId, extId }
}
