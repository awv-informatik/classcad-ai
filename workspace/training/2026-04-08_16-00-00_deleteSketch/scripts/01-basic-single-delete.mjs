// Test basic single sketch deletion
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a sketch
  const skId = (await api.v1.sketch.create({ id: partId, name: 'ToDelete' })).result
  console.log('[01] created sketch:', skId)

  // Verify it exists via getSketch
  const before = await api.v1.part.getSketch({ id: partId, name: 'ToDelete' })
  console.log('[01] getSketch before delete:', before.result, 'maxLevel:', before.maxLevel)

  // Dump structure before deletion
  filewrite(api.v1.part.getSketch({ id: partId, name: 'ToDelete' }), 'getSketch-before')

  // Delete
  const r = await api.v1.sketch.deleteSketch({ ids: [skId] })
  console.log('[01] deleteSketch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-response')

  // Verify it's gone
  const after = await api.v1.part.getSketch({ id: partId, name: 'ToDelete' })
  console.log('[01] getSketch after delete:', after.result, 'maxLevel:', after.maxLevel)
  console.log('[01] after messages:', JSON.stringify(after.messages))

  return { partId }
}
