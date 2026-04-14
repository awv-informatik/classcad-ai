// Test: can you pass a sketchRegion ID to curves?
// sketchRegion is a different object than raw sketch elements
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchRegionTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineIds = (await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [60, 40, 0],
  })).result
  console.log('[04] lineIds:', JSON.stringify(lineIds))

  // Create a sketchRegion from the lines
  const regionResult = await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: lineIds,
  })
  console.log('[04] sketchRegion result:', regionResult.result, 'maxLevel:', regionResult.maxLevel)
  if (regionResult.messages?.length) {
    console.log('[04] region messages:', JSON.stringify(regionResult.messages.map(m => m.message)))
  }
  const regionId = regionResult.result

  // Test A: pass sketchRegion ID as scalar
  const resultA = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: regionId,
  })
  console.log('[04A] region as scalar result:', resultA.result, 'maxLevel:', resultA.maxLevel)
  if (resultA.messages?.length) {
    console.log('[04A] messages:', JSON.stringify(resultA.messages.map(m => m.message)))
  }

  // Test B: pass sketchRegion ID wrapped in array
  const resultB = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: [regionId],
  })
  console.log('[04B] region in array result:', resultB.result, 'maxLevel:', resultB.maxLevel)
  if (resultB.messages?.length) {
    console.log('[04B] messages:', JSON.stringify(resultB.messages.map(m => m.message)))
  }

  filewrite({
    lineIds,
    regionId,
    testA: { curves: regionId, result: resultA.result, maxLevel: resultA.maxLevel, messages: resultA.messages },
    testB: { curves: [regionId], result: resultB.result, maxLevel: resultB.maxLevel, messages: resultB.messages },
  }, 'sketch-region-tests')

  return { partId }
}
