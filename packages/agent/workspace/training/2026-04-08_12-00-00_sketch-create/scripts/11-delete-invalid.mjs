// Test: sketch.deleteSketch with invalid IDs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  // Delete non-existent sketch ID
  const r1 = await api.v1.sketch.deleteSketch({ ids: [99999] })
  console.log('[11] delete invalid result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[11] delete invalid messages:', JSON.stringify(r1.messages))

  // Delete already-deleted sketch
  const skId = (await api.v1.sketch.create({ id: partId, name: 'ToDelete' })).result
  await api.v1.sketch.deleteSketch({ ids: [skId] })
  const r2 = await api.v1.sketch.deleteSketch({ ids: [skId] })
  console.log('[11] delete already-deleted result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[11] delete already-deleted messages:', JSON.stringify(r2.messages))

  // Delete empty array
  const r3 = await api.v1.sketch.deleteSketch({ ids: [] })
  console.log('[11] delete empty result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    invalidId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    alreadyDeleted: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    emptyArray: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'delete-invalid')

  return { partId }
}
