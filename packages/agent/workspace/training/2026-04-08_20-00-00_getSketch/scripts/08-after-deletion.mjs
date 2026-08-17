// Test getSketch after sketch deletion
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const skId = (await api.v1.part.sketch({ id: partId, name: 'WillDelete' })).result
  console.log('[08] created sketch id:', skId)

  // Verify it's findable
  const r1 = await api.v1.part.getSketch({ id: partId, name: 'WillDelete' })
  console.log('[08] before delete:', r1.result, 'match:', r1.result === skId)

  // Delete it
  const delR = await api.v1.sketch.deleteSketch({ ids: [skId] })
  console.log('[08] delete maxLevel:', delR.maxLevel)

  // Try to find it now
  const r2 = await api.v1.part.getSketch({ id: partId, name: 'WillDelete' })
  console.log('[08] after delete result:', r2.result)
  console.log('[08] after delete maxLevel:', r2.maxLevel)
  console.log('[08] after delete messages:', JSON.stringify(r2.messages))

  filewrite({
    beforeDelete: { result: r1.result, maxLevel: r1.maxLevel },
    afterDelete: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'after-deletion-response')

  return { partId }
}
