// Test transparency setting, and check if appearance persists through save/load
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TransparencyTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Test transparency only (no color)
  const r1 = await api.v1.common.setAppearance({ target: eifId, transparency: 0.5 })
  console.log('[03] transparency only result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Test transparency = 0 (fully opaque)
  const r2 = await api.v1.common.setAppearance({ target: eifId, transparency: 0.0 })
  console.log('[03] transparency=0 result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Test transparency = 1 (fully transparent)
  const r3 = await api.v1.common.setAppearance({ target: eifId, transparency: 1.0 })
  console.log('[03] transparency=1 result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Test edge: transparency > 1
  const r4 = await api.v1.common.setAppearance({ target: eifId, transparency: 2.0 })
  console.log('[03] transparency=2.0 result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'transparency-2')

  // Test edge: transparency < 0
  const r5 = await api.v1.common.setAppearance({ target: eifId, transparency: -1.0 })
  console.log('[03] transparency=-1 result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'transparency-neg')

  // Test: no color, no transparency — empty setAppearance
  const r6 = await api.v1.common.setAppearance({ target: eifId })
  console.log('[03] empty setAppearance result:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'empty-appearance')

  return { partId }
}
