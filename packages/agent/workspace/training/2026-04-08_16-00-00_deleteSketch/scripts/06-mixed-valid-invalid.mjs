// Test mixed valid + invalid IDs — partial success or all-or-nothing?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const sk1 = (await api.v1.sketch.create({ id: partId, name: 'Valid1' })).result
  const sk2 = (await api.v1.sketch.create({ id: partId, name: 'Valid2' })).result
  console.log('[06] created sketches:', sk1, sk2)

  // Delete with one valid, one bogus, one valid
  const r = await api.v1.sketch.deleteSketch({ ids: [sk1, 99999, sk2] })
  console.log('[06] mixed delete result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mixed-delete-response')

  // Check which ones survived
  const check1 = await api.v1.part.getSketch({ id: partId, name: 'Valid1' })
  const check2 = await api.v1.part.getSketch({ id: partId, name: 'Valid2' })
  console.log('[06] Valid1 after:', check1.result, 'maxLevel:', check1.maxLevel)
  console.log('[06] Valid2 after:', check2.result, 'maxLevel:', check2.maxLevel)

  // Interpretation: if both are gone, it's partial success (valid IDs deleted, invalid errored)
  // If both survive, it's all-or-nothing (one invalid aborts the whole call)
  console.log('[06] conclusion: Valid1 gone?', check1.result === null, 'Valid2 gone?', check2.result === null)

  return { partId }
}
