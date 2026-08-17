export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const extR = await api.v1.part.extrusion({
    id: partId, references: [regionId], name: 'OriginalName', limit2: 50,
  })
  const extId = extR.result
  console.log('[07] extId:', extId)

  // Dump structure to see its shape and find the name
  filewrite(extR.structure, 'structure-before')

  // Update name only
  await api.v1.part.openFeature({ id: extId })
  const r = await api.v1.part.updateExtrusion({ id: extId, name: 'RenamedExtrusion' })
  console.log('[07] rename result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rename-response')
  await api.v1.part.closeFeature({ id: extId })

  // Dump structure after to verify name change
  filewrite(r.structure, 'structure-after')

  return { partId, extId }
}
