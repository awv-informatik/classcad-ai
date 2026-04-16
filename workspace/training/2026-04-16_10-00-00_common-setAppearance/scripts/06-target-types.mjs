// Test setAppearance on different object types: part, sketch, work geometry, solid IDs
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TargetTypesTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

  // Also create a sketch and work plane
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0],
  })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  console.log('[06] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'wpId:', wpId, 'skId:', skId)

  // Test on part ID
  const r1 = await api.v1.common.setAppearance({ target: partId, color: [255, 0, 0] })
  console.log('[06] part target result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'target-part')

  // Test on entity injection ID (already tested — should work)
  const r2 = await api.v1.common.setAppearance({ target: eifId, color: [0, 255, 0] })
  console.log('[06] eif target result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Test on raw solid ID (boxId)
  const r3 = await api.v1.common.setAppearance({ target: boxId, color: [0, 0, 255] })
  console.log('[06] solid ID target result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'target-solid')

  // Test on work plane ID
  const r4 = await api.v1.common.setAppearance({ target: wpId, color: [255, 255, 0] })
  console.log('[06] workplane target result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'target-workplane')

  // Test on sketch ID
  const r5 = await api.v1.common.setAppearance({ target: skId, color: [255, 0, 255] })
  console.log('[06] sketch target result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'target-sketch')

  // Test on invalid ID
  const r6 = await api.v1.common.setAppearance({ target: 999999, color: [128, 128, 128] })
  console.log('[06] invalid ID result:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'target-invalid')

  return { partId }
}
