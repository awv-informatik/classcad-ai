// Test: does revolve also accept sketch element IDs as curves?
// Compare both forms with revolve
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RevolveCurvesTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Form A: shape ID
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 40, ya: 0 },
      { xa: 55, ya: 0 },
      { xa: 55, ya: 15 },
      { xa: 40, ya: 15 },
    ],
    close: true,
  })

  const revA = await api.v1.solid.revolve({
    id: eifId,
    originPos: [0, 0, 0],
    direction: [0, 1, 0],
    angle: Math.PI * 2,
    curves: shapeId,
  })
  console.log('[06A] revolve with shapeId result:', revA.result, 'maxLevel:', revA.maxLevel)

  // Form B: sketch element IDs
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const lineIds = (await api.v1.sketch.rectangle({
    id: skId,
    startPos: [40, 0, 0],
    endPos: [55, 15, 0],
  })).result
  console.log('[06] lineIds:', JSON.stringify(lineIds))

  const revB = await api.v1.solid.revolve({
    id: eifId,
    originPos: [0, 0, 0],
    direction: [0, 1, 0],
    angle: Math.PI * 2,
    curves: lineIds,
  })
  console.log('[06B] revolve with lineIds result:', revB.result, 'maxLevel:', revB.maxLevel)
  if (revB.messages?.length) {
    console.log('[06B] messages:', JSON.stringify(revB.messages.map(m => m.message)))
  }

  filewrite({
    formA: { curves: 'shapeId=' + shapeId, result: revA.result, maxLevel: revA.maxLevel, messages: revA.messages },
    formB: { curves: 'lineIds=' + JSON.stringify(lineIds), result: revB.result, maxLevel: revB.maxLevel, messages: revB.messages },
  }, 'revolve-curves-forms')

  await snapshot('revolve-both-forms')
  return { partId }
}
