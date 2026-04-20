export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create extrusion with no taper
  const extId = (await api.v1.part.extrusion({
    id: partId, references: [regionId], type: 'UP', limit2: 60,
  })).result

  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 10, width: 10, height: 10 })).result

  await snapshot('before-no-taper')

  // Add taper (positive = inward, top smaller)
  await api.v1.part.openFeature({ id: extId })
  const r = await api.v1.part.updateExtrusion({ id: extId, taperAngle: 0.15 })
  console.log('[04] add taper 0.15:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'taper-add-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-taper-positive')

  // Change taper (negative = outward, top bigger)
  await api.v1.part.openFeature({ id: extId })
  const r2 = await api.v1.part.updateExtrusion({ id: extId, taperAngle: -0.15 })
  console.log('[04] negative taper -0.15:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'taper-neg-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-taper-negative')

  // Remove taper (back to 0)
  await api.v1.part.openFeature({ id: extId })
  const r3 = await api.v1.part.updateExtrusion({ id: extId, taperAngle: 0 })
  console.log('[04] remove taper 0:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'taper-remove-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-taper-removed')

  return { partId, extId }
}
