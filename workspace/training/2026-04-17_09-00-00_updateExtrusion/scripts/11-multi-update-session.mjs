export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const extId = (await api.v1.part.extrusion({
    id: partId, references: [regionId], type: 'UP', limit2: 30,
  })).result
  console.log('[11] extId:', extId)

  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 10, width: 10, height: 10 })).result

  await snapshot('before')

  // Open feature ONCE, make MULTIPLE update calls, close ONCE
  await api.v1.part.openFeature({ id: extId })

  const r1 = await api.v1.part.updateExtrusion({ id: extId, limit2: 80 })
  console.log('[11] update limit2:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.updateExtrusion({ id: extId, taperAngle: 0.1 })
  console.log('[11] update taper:', r2.result, 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.part.updateExtrusion({ id: extId, name: 'MultiUpdate' })
  console.log('[11] update name:', r3.result, 'maxLevel:', r3.maxLevel)

  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-multi')

  filewrite({
    update1: { result: r1.result, maxLevel: r1.maxLevel },
    update2: { result: r2.result, maxLevel: r2.maxLevel },
    update3: { result: r3.result, maxLevel: r3.maxLevel },
  }, 'multi-updates')

  return { partId, extId }
}
