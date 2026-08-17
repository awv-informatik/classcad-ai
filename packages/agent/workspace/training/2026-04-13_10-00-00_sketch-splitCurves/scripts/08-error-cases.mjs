// Test: Error cases — invalid IDs, wrong ID types
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorCases' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

  // Test 1: Pass part ID instead of sketch ID
  const r1 = await api.v1.sketch.splitCurves({
    id: partId,
    splits: [{ geomId: lineId, values: [0.5] }]
  })
  console.log('[08] wrong sketch ID — maxLevel:', r1.maxLevel, 'result:', JSON.stringify(r1.result))
  if (r1.messages?.length) console.log('[08] wrong sketch ID — msg:', r1.messages[0]?.message)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'error-wrong-sketch-id')

  // Test 2: Invalid geomId (nonexistent)
  const r2 = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: 99999, values: [0.5] }]
  })
  console.log('[08] invalid geomId — maxLevel:', r2.maxLevel, 'result:', JSON.stringify(r2.result))
  if (r2.messages?.length) console.log('[08] invalid geomId — msg:', r2.messages[0]?.message)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'error-invalid-geomid')

  // Test 3: Empty splits array
  const r3 = await api.v1.sketch.splitCurves({
    id: skId,
    splits: []
  })
  console.log('[08] empty splits — maxLevel:', r3.maxLevel, 'result:', JSON.stringify(r3.result))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'error-empty-splits')

  // Test 4: Empty values array
  const r4 = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [] }]
  })
  console.log('[08] empty values — maxLevel:', r4.maxLevel, 'result:', JSON.stringify(r4.result))
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'error-empty-values')

  // Test 5: Pass a point ID instead of curve
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [10, 10, 0] })).result
  const r5 = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: ptId, values: [0.5] }]
  })
  console.log('[08] point geomId — maxLevel:', r5.maxLevel, 'result:', JSON.stringify(r5.result))
  if (r5.messages?.length) console.log('[08] point geomId — msg:', r5.messages[0]?.message)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'error-point-geomid')

  return { partId }
}
