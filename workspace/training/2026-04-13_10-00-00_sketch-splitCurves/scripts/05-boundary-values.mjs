// Test: Edge cases — split at boundary values (0, 1) and out-of-range
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoundaryValues' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Test 1: Split at 0.0 (start point)
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 20, 0], endPos: [50, 20, 0] })).result
  const r1 = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: line1, values: [0.0] }]
  })
  console.log('[05] split at 0.0 — result:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'split-at-0')

  // Test 2: Split at 1.0 (end point) — need new sketch since split changes state
  const partId2 = (await api.v1.part.create({ name: 'BoundaryEnd' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2 })).result
  const line2 = (await api.v1.sketch.line({ id: skId2, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const r2 = await api.v1.sketch.splitCurves({
    id: skId2,
    splits: [{ geomId: line2, values: [1.0] }]
  })
  console.log('[05] split at 1.0 — result:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'split-at-1')

  // Test 3: Out of range — negative value
  const partId3 = (await api.v1.part.create({ name: 'BoundaryNeg' })).result
  const skId3 = (await api.v1.sketch.create({ id: partId3 })).result
  const line3 = (await api.v1.sketch.line({ id: skId3, startPos: [-50, -20, 0], endPos: [50, -20, 0] })).result
  const r3 = await api.v1.sketch.splitCurves({
    id: skId3,
    splits: [{ geomId: line3, values: [-0.5] }]
  })
  console.log('[05] split at -0.5 — result:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'split-at-neg')

  // Test 4: Out of range — value > 1
  const partId4 = (await api.v1.part.create({ name: 'BoundaryOver' })).result
  const skId4 = (await api.v1.sketch.create({ id: partId4 })).result
  const line4 = (await api.v1.sketch.line({ id: skId4, startPos: [-50, -40, 0], endPos: [50, -40, 0] })).result
  const r4 = await api.v1.sketch.splitCurves({
    id: skId4,
    splits: [{ geomId: line4, values: [1.5] }]
  })
  console.log('[05] split at 1.5 — result:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'split-at-1.5')

  return { partId }
}
