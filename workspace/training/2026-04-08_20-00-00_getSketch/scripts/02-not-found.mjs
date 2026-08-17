// Test getSketch with non-existent name
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // No sketches created — look for one that doesn't exist
  const r = await api.v1.part.getSketch({ id: partId, name: 'DoesNotExist' })
  console.log('[02] result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'not-found-response')

  return { partId }
}
