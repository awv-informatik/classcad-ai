export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PerpDir' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-20, -15, 0], endPos: [20, 15, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Perpendicular direction [1,0,0] — should fail (like extrusion)
  const r1 = await api.v1.part.twist({
    id: partId, name: 'PerpTwist', references: [regionId],
    type: 'CUSTOM', twistAngle: Math.PI / 4, limit2: 100,
    direction: [1, 0, 0],
  })
  console.log('[09] perpendicular [1,0,0]:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages) {
    for (const m of r1.messages) {
      console.log('[09]   msg:', m.level, m.code, m.message)
    }
  }
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'perpendicular-response')

  return { partId }
}
