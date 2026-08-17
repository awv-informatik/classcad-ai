// 15 — Test degree string format (e.g. '45deg', '90deg') with updateDimension on ANGLE
// Also test numeric-as-string for non-angle types
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines for ANGLE
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 60, 0] })).result
  const angleDim = (await api.v1.sketch.dimension({
    id: skId, type: 'ANGLE', geomIds: [l1, l2], dimPos: [30, 15, 0]
  })).result

  // Test '45deg' string format
  const r1 = await api.v1.sketch.updateDimension({ id: angleDim, value: '45deg' })
  console.log('[15] 45deg result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, '45deg')

  // Test '90deg'
  const r2 = await api.v1.sketch.updateDimension({ id: angleDim, value: '90deg' })
  console.log('[15] 90deg result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, '90deg')

  // Test '0deg'
  const r3 = await api.v1.sketch.updateDimension({ id: angleDim, value: '0deg' })
  console.log('[15] 0deg result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, '0deg')

  // Test '360deg'
  const r4 = await api.v1.sketch.updateDimension({ id: angleDim, value: '360deg' })
  console.log('[15] 360deg result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, '360deg')

  // Test with 'mm' suffix on offset
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [0, -30, 0], endPos: [80, -30, 0] })).result
  const offsetDim = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l3] })).result

  const r5 = await api.v1.sketch.updateDimension({ id: offsetDim, value: '50mm' })
  console.log('[15] 50mm result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, '50mm')

  return { partId }
}
