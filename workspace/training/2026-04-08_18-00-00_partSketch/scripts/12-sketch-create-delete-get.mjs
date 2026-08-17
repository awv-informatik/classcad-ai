// 12 — Lifecycle: create via part.sketch, delete via sketch.deleteSketch, then getSketch
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const sk = await api.v1.part.sketch({ id: partId, name: 'Temp' })
  console.log('[12] created:', sk.result)

  // Delete it
  const del = await api.v1.sketch.deleteSketch({ ids: [sk.result] })
  console.log('[12] delete maxLevel:', del.maxLevel)

  // Try to retrieve deleted sketch
  const gone = await api.v1.part.getSketch({ id: partId, name: 'Temp' })
  console.log('[12] after delete — result:', gone.result, 'maxLevel:', gone.maxLevel)
  console.log('[12] after delete — msgs:', JSON.stringify(gone.messages))

  filewrite({
    created: sk.result,
    deleteMaxLevel: del.maxLevel,
    afterDelete: { result: gone.result, maxLevel: gone.maxLevel, messages: gone.messages },
  }, 'lifecycle')

  return { partId }
}
