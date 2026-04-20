export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CapStr' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-25, -15, 0], endPos: [25, 15, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Test capEnds with string 'FALSE' (should it fail like extrusion?)
  const r1 = await api.v1.part.twist({
    id: partId, name: 'StringCap', references: [regionId],
    twistAngle: Math.PI / 2, limit2: 80, capEnds: 'FALSE',
  })
  console.log('[16] capEnds="FALSE":', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages) r1.messages.forEach(m => console.log('[16]   msg:', m.level, m.code, m.message))

  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'cap-string-response')

  return { partId }
}
