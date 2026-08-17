// 05 — Error paths: invalid IDs, sketch ID instead of dim ID, missing params
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result

  // Create a valid dimension first
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1] })).result
  console.log('[05] valid dimId:', dimId)

  // Test 1: Pass sketch ID instead of dimension ID
  const r1 = await api.v1.sketch.updateDimension({ id: skId, value: 50 })
  console.log('[05] sketchId-as-dimId result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'sketch-id-error')

  // Test 2: Pass part ID instead of dimension ID
  const r2 = await api.v1.sketch.updateDimension({ id: partId, value: 50 })
  console.log('[05] partId-as-dimId result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'part-id-error')

  // Test 3: Pass a line ID instead of dimension ID
  const r3 = await api.v1.sketch.updateDimension({ id: l1, value: 50 })
  console.log('[05] lineId-as-dimId result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'line-id-error')

  // Test 4: Pass a bogus numeric ID
  const r4 = await api.v1.sketch.updateDimension({ id: 99999, value: 50 })
  console.log('[05] bogusId result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'bogus-id-error')

  // Test 5: Missing value param
  const r5 = await api.v1.sketch.updateDimension({ id: dimId })
  console.log('[05] no-value result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'no-value-error')

  // Test 6: Missing id param
  const r6 = await api.v1.sketch.updateDimension({ value: 50 })
  console.log('[05] no-id result:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'no-id-error')

  return { partId }
}
