// Test getSketch with empty string name and sketch created with empty name
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a sketch with empty name
  const sk = (await api.v1.part.sketch({ id: partId, name: '' })).result
  console.log('[04] created sketch with empty name, id:', sk)

  // Try to find it with empty name
  const r1 = await api.v1.part.getSketch({ id: partId, name: '' })
  console.log('[04] getSketch("") result:', r1.result)
  console.log('[04] maxLevel:', r1.maxLevel)
  console.log('[04] match:', r1.result === sk)

  filewrite({ createdId: sk, foundId: r1.result, match: r1.result === sk, maxLevel: r1.maxLevel, messages: r1.messages }, 'empty-name-response')

  return { partId }
}
