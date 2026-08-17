export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DiagDir' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-20, -15, 0], endPos: [20, 15, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Diagonal direction — twist along [1,0,1]
  const r1 = await api.v1.part.twist({
    id: partId, name: 'DiagTwist', references: [regionId],
    type: 'CUSTOM', twistAngle: Math.PI / 2, limit2: 100,
    direction: [1, 0, 1],
  })
  console.log('[08] diagonal [1,0,1]:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'diagonal-response')
  await snapshot('diagonal')

  return { partId }
}
