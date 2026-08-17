// 10: Error cases — trim with invalid IDs, non-split IDs, empty array
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimErrors' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw two intersecting lines
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, -50, 0], endPos: [0, 50, 0] })).result

  // Test 1: Trim with completely invalid ID (no split)
  const t1 = await api.v1.sketch.trimCurves({ id: skId, curveIds: [99999] })
  console.log('[10] test1 (invalid ID) maxLevel:', t1.maxLevel, 'messages:', JSON.stringify(t1.messages))

  // Test 2: Trim with empty array
  const t2 = await api.v1.sketch.trimCurves({ id: skId, curveIds: [] })
  console.log('[10] test2 (empty array) maxLevel:', t2.maxLevel, 'messages:', JSON.stringify(t2.messages))

  // Test 3: Trim with original line ID (not a split sub-curve)
  const t3 = await api.v1.sketch.trimCurves({ id: skId, curveIds: [line1] })
  console.log('[10] test3 (original line ID) maxLevel:', t3.maxLevel, 'messages:', JSON.stringify(t3.messages))

  // Now split and test
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[10] split IDs:', JSON.stringify(splitRes.result))

  // Test 4: Trim a valid split ID, then try to trim it again
  const validId = splitRes.result[0]
  const t4a = await api.v1.sketch.trimCurves({ id: skId, curveIds: [validId] })
  console.log('[10] test4a (valid trim) maxLevel:', t4a.maxLevel)

  const t4b = await api.v1.sketch.trimCurves({ id: skId, curveIds: [validId] })
  console.log('[10] test4b (re-trim same ID) maxLevel:', t4b.maxLevel, 'messages:', JSON.stringify(t4b.messages))

  // Test 5: Trim with mix of valid and invalid IDs
  const t5 = await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitRes.result[1], 99999] })
  console.log('[10] test5 (valid + invalid) maxLevel:', t5.maxLevel, 'messages:', JSON.stringify(t5.messages))

  return { partId }
}
