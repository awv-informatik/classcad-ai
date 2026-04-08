// Test: delete a sketch, then try to get it by name
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  const skId = (await api.v1.sketch.create({ id: partId, name: 'WillBeDeleted' })).result
  console.log('[19] created:', skId)

  // Verify getSketch works
  const found1 = await api.v1.part.getSketch({ id: partId, name: 'WillBeDeleted' })
  console.log('[19] found before delete:', found1.result)

  // Delete
  await api.v1.sketch.deleteSketch({ ids: [skId] })

  // Try to get it now
  const found2 = await api.v1.part.getSketch({ id: partId, name: 'WillBeDeleted' })
  console.log('[19] found after delete:', found2.result, 'maxLevel:', found2.maxLevel)

  filewrite({
    beforeDelete: found1.result,
    afterDelete: { result: found2.result, maxLevel: found2.maxLevel, messages: found2.messages },
  }, 'delete-then-get')

  return { partId }
}
