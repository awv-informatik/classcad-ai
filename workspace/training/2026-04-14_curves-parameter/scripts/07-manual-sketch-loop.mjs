// Test: sketch elements from individual lines forming a closed loop (not rectangle)
// This tests whether any sketch-curve elements work, not just rectangle results
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ManualLoopTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw an L-shape with individual lines
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [60, 20, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [60, 20, 0], endPos: [30, 20, 0] })).result
  const l4 = (await api.v1.sketch.line({ id: skId, startPos: [30, 20, 0], endPos: [30, 40, 0] })).result
  const l5 = (await api.v1.sketch.line({ id: skId, startPos: [30, 40, 0], endPos: [0, 40, 0] })).result
  const l6 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [0, 0, 0] })).result

  const lineIds = [l1, l2, l3, l4, l5, l6]
  console.log('[07] manual L-shape lineIds:', JSON.stringify(lineIds))

  const extResult = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 25],
    curves: lineIds,
  })
  console.log('[07] extrusion result:', extResult.result, 'maxLevel:', extResult.maxLevel)
  if (extResult.messages?.length) {
    console.log('[07] messages:', JSON.stringify(extResult.messages.map(m => m.message)))
  }

  filewrite({
    lineIds,
    result: extResult.result,
    maxLevel: extResult.maxLevel,
    messages: extResult.messages,
  }, 'manual-loop')

  await snapshot('manual-l-shape')
  return { partId }
}
