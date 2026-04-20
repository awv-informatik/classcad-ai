export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoOpen' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-25, -15, 0], endPos: [25, 15, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const twistId = (await api.v1.part.twist({
    id: partId, references: [regionId], twistAngle: Math.PI / 4, limit2: 80,
  })).result
  console.log('[15] created:', twistId)

  // Try updateTwist WITHOUT openFeature
  const r1 = await api.v1.part.updateTwist({
    id: twistId, twistAngle: Math.PI,
  })
  console.log('[15] update without open:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages) r1.messages.forEach(m => console.log('[15]   msg:', m.level, m.code, m.message))

  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'no-open-response')

  return { partId }
}
