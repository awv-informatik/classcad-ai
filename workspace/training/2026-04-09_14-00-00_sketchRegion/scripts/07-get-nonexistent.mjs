// getSketchRegion with a nonexistent name — expect VOID or error
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GetTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // No regions exist — try to find one
  const r1 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'DoesNotExist' })
  console.log('[07] nonexistent result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] messages:', JSON.stringify(r1.messages))

  // Create one region, then search for a different name
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })
  const region = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect.result, name: 'RealRegion' })

  const r2 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'WrongName' })
  console.log('[07] wrong name result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Confirm the correct name works
  const r3 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'RealRegion' })
  console.log('[07] correct name result:', r3.result, 'match:', r3.result === region.result)

  filewrite({
    nonexistent: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    wrongName: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    correctName: { result: r3.result, match: r3.result === region.result },
  }, 'get-nonexistent')

  return { partId }
}
