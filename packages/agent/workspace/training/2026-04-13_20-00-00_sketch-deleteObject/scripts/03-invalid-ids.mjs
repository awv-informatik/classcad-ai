// Test: edge cases — invalid IDs, empty array, already-deleted IDs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DelEdgeCases' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[03] line ID:', line)

  // Test 1: empty ids array
  const r1 = await api.v1.sketch.deleteObject({ ids: [] })
  console.log('[03] empty ids result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'empty-ids-response')

  // Test 2: nonexistent ID (9999)
  const r2 = await api.v1.sketch.deleteObject({ ids: [9999] })
  console.log('[03] invalid id result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'invalid-id-response')

  // Test 3: delete the line, then try to delete it again
  const r3 = await api.v1.sketch.deleteObject({ ids: [line] })
  console.log('[03] first delete result:', r3.result, 'maxLevel:', r3.maxLevel)

  const r4 = await api.v1.sketch.deleteObject({ ids: [line] })
  console.log('[03] double delete result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'double-delete-response')

  return { partId }
}
