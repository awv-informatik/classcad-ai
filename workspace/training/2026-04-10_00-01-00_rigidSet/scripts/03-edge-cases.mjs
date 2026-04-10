// 03 — Edge cases: empty geomIds, single element, invalid ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCases' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[03] line1:', line1)

  // Test 1: empty geomIds
  const r1 = await api.v1.sketch.rigidSet({ id: skId, geomIds: [] })
  console.log('[03] empty geomIds — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'empty-response')

  // Test 2: single element
  const r2 = await api.v1.sketch.rigidSet({ id: skId, geomIds: [line1] })
  console.log('[03] single element — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'single-response')

  // Test 3: invalid ID (999999)
  const r3 = await api.v1.sketch.rigidSet({ id: skId, geomIds: [999999] })
  console.log('[03] invalid ID — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[03] invalid ID messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'invalid-response')

  return { partId }
}
