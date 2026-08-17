// Invalid/wrong ID types: sketch ID, curve ID, fake ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0],
  })).result
  await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'Test' })

  // Sketch ID instead of part ID
  const rSketch = await api.v1.part.getSketchRegion({ id: skId, name: 'Test' })
  console.log('[07] sketch ID:', rSketch.result, 'maxLevel:', rSketch.maxLevel)
  console.log('[07] sketch ID messages:', JSON.stringify(rSketch.messages))

  // Curve ID
  const rCurve = await api.v1.part.getSketchRegion({ id: rectIds[0], name: 'Test' })
  console.log('[07] curve ID:', rCurve.result, 'maxLevel:', rCurve.maxLevel)

  // Fake ID
  const rFake = await api.v1.part.getSketchRegion({ id: 99999, name: 'Test' })
  console.log('[07] fake ID:', rFake.result, 'maxLevel:', rFake.maxLevel)

  filewrite({
    sketchId: { result: rSketch.result, maxLevel: rSketch.maxLevel, messages: rSketch.messages },
    curveId: { result: rCurve.result, maxLevel: rCurve.maxLevel, messages: rCurve.messages },
    fakeId: { result: rFake.result, maxLevel: rFake.maxLevel, messages: rFake.messages },
  }, 'invalid-ids')

  return { partId }
}
