// Test: can you pass a single sketch element ID (not wrapped in array)?
// Also test: what about passing only some of the rectangle's lines (incomplete loop)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SingleElementTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineIds = (await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [60, 40, 0],
  })).result
  console.log('[03] lineIds:', JSON.stringify(lineIds))

  // Test A: single ID as a scalar (not wrapped in array)
  const resultA = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: lineIds[0],
  })
  console.log('[03A] single scalar ID result:', resultA.result, 'maxLevel:', resultA.maxLevel)
  if (resultA.messages?.length) {
    console.log('[03A] messages:', JSON.stringify(resultA.messages.map(m => m.message)))
  }

  // Test B: single ID wrapped in array
  const resultB = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: [lineIds[0]],
  })
  console.log('[03B] single array ID result:', resultB.result, 'maxLevel:', resultB.maxLevel)
  if (resultB.messages?.length) {
    console.log('[03B] messages:', JSON.stringify(resultB.messages.map(m => m.message)))
  }

  // Test C: partial array (2 out of 4 lines — not a closed loop)
  const resultC = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: [lineIds[0], lineIds[1]],
  })
  console.log('[03C] partial array result:', resultC.result, 'maxLevel:', resultC.maxLevel)
  if (resultC.messages?.length) {
    console.log('[03C] messages:', JSON.stringify(resultC.messages.map(m => m.message)))
  }

  filewrite({
    lineIds,
    testA: { curves: lineIds[0], result: resultA.result, maxLevel: resultA.maxLevel, messages: resultA.messages },
    testB: { curves: [lineIds[0]], result: resultB.result, maxLevel: resultB.maxLevel, messages: resultB.messages },
    testC: { curves: [lineIds[0], lineIds[1]], result: resultC.result, maxLevel: resultC.maxLevel, messages: resultC.messages },
  }, 'single-element-tests')

  return { partId }
}
