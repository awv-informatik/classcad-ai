export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TwistCustom' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-25, -15, 0], endPos: [25, 15, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // CUSTOM type with custom direction and limits
  const r1 = await api.v1.part.twist({
    id: partId, name: 'CustomTwist', references: [regionId],
    type: 'CUSTOM',
    direction: [0, 0, 1],
    limit1: 20,
    limit2: 120,
    twistAngle: Math.PI / 2,
  })
  console.log('[05] CUSTOM basic:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'custom-basic-response')
  await snapshot('custom-basic')

  return { partId }
}
