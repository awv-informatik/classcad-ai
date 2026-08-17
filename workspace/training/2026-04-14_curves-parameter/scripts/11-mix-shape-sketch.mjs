// Test: can you mix a shape ID and sketch element IDs in the same array?
// The docs suggest these are separate modes — but what if you try both at once?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a shape with a partial profile (half the rectangle)
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'HalfProfile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 50, ya: 0 },
    ],
    close: false,
  })

  // Create sketch lines for the other half
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 30, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 30, 0], endPos: [0, 30, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [0, 0, 0] })).result

  console.log('[11] shapeId:', shapeId, 'sketchLines:', l1, l2, l3)

  // Mix shape ID + sketch element IDs in same array
  const extResult = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 25],
    curves: [shapeId, l1, l2, l3],
  })
  console.log('[11] mixed array result:', extResult.result, 'maxLevel:', extResult.maxLevel)
  if (extResult.messages?.length) {
    console.log('[11] messages:', JSON.stringify(extResult.messages.map(m => m.message)))
  }

  filewrite({
    shapeId,
    sketchLines: [l1, l2, l3],
    result: extResult.result,
    maxLevel: extResult.maxLevel,
    messages: extResult.messages,
  }, 'mix-shape-sketch')

  return { partId }
}
