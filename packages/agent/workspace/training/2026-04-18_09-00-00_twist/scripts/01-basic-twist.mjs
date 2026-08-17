export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TwistTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-40, -25, 0], endPos: [40, 25, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Basic twist with default params (twistAngle=0 should be straight extrusion)
  const r1 = await api.v1.part.twist({
    id: partId,
    name: 'BasicTwist',
    references: [regionId],
  })
  console.log('[01] basic twist (angle=0):', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'basic-twist-response')
  await snapshot('basic-twist-zero-angle')

  return { partId }
}
