// Test deleting multiple sketches in one call
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const sk1 = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result
  const sk2 = (await api.v1.sketch.create({ id: partId, name: 'Sk2' })).result
  const sk3 = (await api.v1.sketch.create({ id: partId, name: 'Sk3' })).result
  console.log('[02] created sketches:', sk1, sk2, sk3)

  // Delete all three at once
  const r = await api.v1.sketch.deleteSketch({ ids: [sk1, sk2, sk3] })
  console.log('[02] deleteSketch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-delete-response')

  // Verify all are gone
  for (const [name, id] of [['Sk1', sk1], ['Sk2', sk2], ['Sk3', sk3]]) {
    const check = await api.v1.part.getSketch({ id: partId, name })
    console.log(`[02] getSketch('${name}') after:`, check.result, 'maxLevel:', check.maxLevel)
  }

  return { partId }
}
