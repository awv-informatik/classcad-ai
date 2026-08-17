// Test getSketchRegion with invalid/wrong ID types
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0]
  })).result
  await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'TestRegion' })

  // Pass part ID instead of sketch ID
  const r1 = await api.v1.sketch.getSketchRegion({ id: partId, name: 'TestRegion' })
  console.log('[07] partId as sketch - result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] partId messages:', JSON.stringify(r1.messages))

  // Pass a fake/nonexistent ID
  const r2 = await api.v1.sketch.getSketchRegion({ id: 99999, name: 'TestRegion' })
  console.log('[07] fakeId - result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[07] fakeId messages:', JSON.stringify(r2.messages))

  // Pass a curve ID
  const r3 = await api.v1.sketch.getSketchRegion({ id: rectIds[0], name: 'TestRegion' })
  console.log('[07] curveId - result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[07] curveId messages:', JSON.stringify(r3.messages))

  filewrite({
    withPartId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    withFakeId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    withCurveId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'invalid-ids')

  return { partId }
}
