// Test empty ids array
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Call with empty array
  const r = await api.v1.sketch.deleteSketch({ ids: [] })
  console.log('[03] empty ids result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-array-response')

  return { partId }
}
