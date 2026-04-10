// 06 — Edge case: zero, negative, and very large values
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [80, 40, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1, l2] })).result
  console.log('[06] dimId:', dimId)

  // Test zero
  const r1 = await api.v1.sketch.updateDimension({ id: dimId, value: 0 })
  console.log('[06] zero result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'zero')

  // Test negative
  const r2 = await api.v1.sketch.updateDimension({ id: dimId, value: -50 })
  console.log('[06] negative result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'negative')

  // Test very large
  const r3 = await api.v1.sketch.updateDimension({ id: dimId, value: 999999 })
  console.log('[06] very-large result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'very-large')

  // Test very small
  const r4 = await api.v1.sketch.updateDimension({ id: dimId, value: 0.0001 })
  console.log('[06] very-small result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'very-small')

  // RADIUS dimension with zero
  const circ = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 80, 0], radius: 20 })).result
  const radDim = (await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circ] })).result

  const r5 = await api.v1.sketch.updateDimension({ id: radDim, value: 0 })
  console.log('[06] RADIUS zero result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'radius-zero')

  const r6 = await api.v1.sketch.updateDimension({ id: radDim, value: -10 })
  console.log('[06] RADIUS negative result:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'radius-negative')

  return { partId }
}
