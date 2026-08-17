export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CenterUP' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [30, -15, 0], endPos: [70, 15, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // twistCenter with UP type — docs say "only used if type = CUSTOM"
  // Does it get silently ignored?
  const r1 = await api.v1.part.twist({
    id: partId, name: 'CenterWithUP', references: [regionId],
    type: 'UP', twistAngle: Math.PI / 2, limit2: 80,
    twistCenter: [50, 0, 0],
  })
  console.log('[17] twistCenter with UP:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'center-up-response')
  await snapshot('center-up')

  return { partId }
}
