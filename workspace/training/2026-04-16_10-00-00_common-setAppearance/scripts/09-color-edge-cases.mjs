// Test color edge cases: out-of-range, floats, negative, missing components
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ColorEdgeCases' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

  // Color > 255
  const r1 = await api.v1.common.setAppearance({ target: eifId, color: [300, 400, 500] })
  console.log('[09] color > 255 result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'color-over-255')

  // Negative color values
  const r2 = await api.v1.common.setAppearance({ target: eifId, color: [-10, -20, -30] })
  console.log('[09] negative color result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'color-negative')

  // Float color values
  const r3 = await api.v1.common.setAppearance({ target: eifId, color: [127.5, 64.3, 200.8] })
  console.log('[09] float color result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Only 2 color components
  const r4 = await api.v1.common.setAppearance({ target: eifId, color: [255, 0] })
  console.log('[09] 2-component color result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'color-2-comp')

  // 4 color components (RGBA-like)
  const r5 = await api.v1.common.setAppearance({ target: eifId, color: [255, 0, 0, 128] })
  console.log('[09] 4-component color result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'color-4-comp')

  // Empty color array
  const r6 = await api.v1.common.setAppearance({ target: eifId, color: [] })
  console.log('[09] empty color result:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'color-empty')

  return { partId }
}
