// Test target as object { id, indices } for multi-solid features
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IndicesTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Create multiple solids in the same entity injection
  const box1 = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [60, 0, 0] })).result
  const cyl1 = (await api.v1.solid.cylinder({ id: eifId, height: 25, diameter: 20, translation: [0, 60, 0] })).result

  console.log('[04] box1:', box1, 'box2:', box2, 'cyl1:', cyl1)

  await snapshot('before')

  // Set color on specific solid by index — index 0 = first solid
  const r1 = await api.v1.common.setAppearance({
    target: { id: eifId, indices: [0] },
    color: [255, 0, 0],
  })
  console.log('[04] index-0 red result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'index-0-response')

  // Set color on second solid
  const r2 = await api.v1.common.setAppearance({
    target: { id: eifId, indices: [1] },
    color: [0, 255, 0],
  })
  console.log('[04] index-1 green result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Set color on third solid
  const r3 = await api.v1.common.setAppearance({
    target: { id: eifId, indices: [2] },
    color: [0, 0, 255],
  })
  console.log('[04] index-2 blue result:', r3.result, 'maxLevel:', r3.maxLevel)

  await snapshot('after-per-solid')

  // Test: out-of-range index
  const r4 = await api.v1.common.setAppearance({
    target: { id: eifId, indices: [99] },
    color: [255, 255, 0],
  })
  console.log('[04] index-99 (out of range) result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'index-out-of-range')

  // Test: multiple indices at once
  const r5 = await api.v1.common.setAppearance({
    target: { id: eifId, indices: [0, 2] },
    color: [255, 128, 0],
  })
  console.log('[04] indices [0,2] result:', r5.result, 'maxLevel:', r5.maxLevel)

  // Test: empty indices array
  const r6 = await api.v1.common.setAppearance({
    target: { id: eifId, indices: [] },
    color: [128, 128, 128],
  })
  console.log('[04] empty indices result:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'empty-indices')

  return { partId, eifId, box1, box2, cyl1 }
}
