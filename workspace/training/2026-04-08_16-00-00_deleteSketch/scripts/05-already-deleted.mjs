// Test deleting an already-deleted sketch
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'WillDelete' })).result
  console.log('[05] created sketch:', skId)

  // Delete it
  const r1 = await api.v1.sketch.deleteSketch({ ids: [skId] })
  console.log('[05] first delete maxLevel:', r1.maxLevel)

  // Delete again
  const r2 = await api.v1.sketch.deleteSketch({ ids: [skId] })
  console.log('[05] second delete result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'double-delete-response')

  return { partId }
}
