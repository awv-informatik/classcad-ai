export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // Create expression-driven params
  await api.v1.part.expression({ id: partId, toCreate: [
    { name: 'BaseW', value: 100 },
    { name: 'BaseD', value: 60 },
    { name: 'BaseH', value: 20 },
    { name: 'WallH', value: 80 },
    { name: 'WallThk', value: 10 },
  ]})

  // Create base plate sketch
  const sk1 = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rect1 = (await api.v1.sketch.rectangle({ id: sk1, startPos: [0, 0, 0], endPos: [100, 60, 0] })).result
  const reg1 = (await api.v1.sketch.sketchRegion({ id: sk1, geomIds: rect1 })).result

  // Base plate extrusion
  const baseExt = (await api.v1.part.extrusion({
    id: partId, name: 'BasePlate', references: [reg1], limit2: '@expr.BaseH',
  })).result
  console.log('[14] base plate:', baseExt)

  await snapshot('step1-base')

  // Now iterate on the design — update the base to be thicker
  await api.v1.part.openFeature({ id: baseExt })
  await api.v1.part.updateExtrusion({ id: baseExt, limit2: 30 })
  await api.v1.part.closeFeature({ id: baseExt })

  await snapshot('step2-thicker-base')

  // Add taper for aesthetics
  await api.v1.part.openFeature({ id: baseExt })
  await api.v1.part.updateExtrusion({ id: baseExt, taperAngle: 0.05 })
  await api.v1.part.closeFeature({ id: baseExt })

  await snapshot('step3-tapered-base')

  // Change to symmetric for centered base
  await api.v1.part.openFeature({ id: baseExt })
  await api.v1.part.updateExtrusion({ id: baseExt, type: 'SYMMETRIC', taperAngle: 0 })
  await api.v1.part.closeFeature({ id: baseExt })

  await snapshot('step4-symmetric-base')

  console.log('[14] workflow complete — 4 design iterations on one feature')

  return { partId, baseExt }
}
