export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // Create expression
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 30 }] })

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create extrusion with numeric limit2
  const extId = (await api.v1.part.extrusion({
    id: partId, references: [regionId], limit2: 30,
  })).result
  console.log('[06] extId:', extId)

  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 10, width: 10, height: 10 })).result
  await snapshot('before-numeric')

  // Update limit2 to expression
  await api.v1.part.openFeature({ id: extId })
  const r = await api.v1.part.updateExtrusion({ id: extId, limit2: '@expr.H' })
  console.log('[06] update to expr:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'expr-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-expr-30')

  // Now change the expression value (should auto-recalc the extrusion)
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 100 }] })
  console.log('[06] expression H updated to 100')

  await snapshot('after-expr-100')

  // Update taperAngle with expression
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'T', value: 0.1 }] })
  await api.v1.part.openFeature({ id: extId })
  const r2 = await api.v1.part.updateExtrusion({ id: extId, taperAngle: '@expr.T' })
  console.log('[06] taper with expr:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'taper-expr-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-taper-expr')

  return { partId, extId }
}
