export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegAngle' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-30, -20, 0], endPos: [30, 20, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Negative twist angle — should twist in opposite direction
  const r1 = await api.v1.part.twist({
    id: partId, name: 'NegTwist', references: [regionId],
    twistAngle: -Math.PI / 2, limit2: 100,
  })
  console.log('[03] negative angle:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'negative-angle-response')
  await snapshot('negative-angle')

  return { partId }
}
