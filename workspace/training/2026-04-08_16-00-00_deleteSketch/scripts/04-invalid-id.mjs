// Test invalid/non-existent sketch ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Try deleting a bogus ID
  const r1 = await api.v1.sketch.deleteSketch({ ids: [99999] })
  console.log('[04] bogus id result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'bogus-id-response')

  // Try deleting a part ID (not a sketch ID)
  const r2 = await api.v1.sketch.deleteSketch({ ids: [partId] })
  console.log('[04] part id result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[04] part id messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'part-id-response')

  return { partId }
}
