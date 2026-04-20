export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const extId = (await api.v1.part.extrusion({
    id: partId, references: [regionId], type: 'UP', limit2: 30,
  })).result

  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 10, width: 10, height: 10 })).result
  await snapshot('before')

  // ALL params in a single update call
  await api.v1.part.openFeature({ id: extId })
  const r = await api.v1.part.updateExtrusion({
    id: extId,
    name: 'FullUpdate',
    type: 'CUSTOM',
    direction: [1, 0, 2],
    limit1: 5,
    limit2: 70,
    taperAngle: 0.08,
    capEnds: 1,
  })
  console.log('[13] combined update:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'combined-response')
  await api.v1.part.closeFeature({ id: extId })

  await snapshot('after-combined')

  return { partId, extId }
}
