// Test: sketch arcs/circles as curves — not just lines
// Also test what sketch.circle returns vs sketch.arc
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Test A: sketch.circle — does it return an ID usable as curves?
  const circResult = await api.v1.sketch.circle({
    id: skId,
    centerPos: [30, 30, 0],
    radius: 20,
  })
  console.log('[08A] sketch.circle result:', circResult.result, 'maxLevel:', circResult.maxLevel)
  console.log('[08A] circle type:', typeof circResult.result)

  if (circResult.result != null) {
    // Try passing circle ID as curves
    const extA = await api.v1.solid.extrusion({
      id: eifId,
      direction: [0, 0, 30],
      curves: [circResult.result],
    })
    console.log('[08A] extrusion with circle result:', extA.result, 'maxLevel:', extA.maxLevel)
    if (extA.messages?.length) {
      console.log('[08A] messages:', JSON.stringify(extA.messages.map(m => m.message)))
    }
    filewrite({ circleId: circResult.result, extResult: { result: extA.result, maxLevel: extA.maxLevel, messages: extA.messages } }, 'circle-extrusion')
  }

  // Test B: single sketch circle as scalar (not array)
  if (circResult.result != null) {
    const extB = await api.v1.solid.extrusion({
      id: eifId,
      direction: [0, 0, 30],
      curves: circResult.result,
    })
    console.log('[08B] circle scalar result:', extB.result, 'maxLevel:', extB.maxLevel)
    if (extB.messages?.length) {
      console.log('[08B] messages:', JSON.stringify(extB.messages.map(m => m.message)))
    }
    filewrite({ circleScalar: circResult.result, extResult: { result: extB.result, maxLevel: extB.maxLevel, messages: extB.messages } }, 'circle-scalar')
  }

  await snapshot('sketch-circle-extrusion')
  return { partId }
}
