// Test: sketch.deleteSketch — delete one and multiple sketches
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  const sk1 = (await api.v1.sketch.create({ id: partId, name: 'Del1' })).result
  const sk2 = (await api.v1.sketch.create({ id: partId, name: 'Del2' })).result
  const sk3 = (await api.v1.sketch.create({ id: partId, name: 'Del3' })).result
  console.log('[10] created:', sk1, sk2, sk3)

  // Delete one sketch
  const r1 = await api.v1.sketch.deleteSketch({ ids: [sk1] })
  console.log('[10] delete sk1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Delete multiple sketches at once
  const r2 = await api.v1.sketch.deleteSketch({ ids: [sk2, sk3] })
  console.log('[10] delete sk2+sk3 result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    deleteSingle: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    deleteMultiple: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'delete-response')

  return { partId }
}
