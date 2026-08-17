// Test: creating multiple sketches on the same part
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result
  console.log('[04] partId:', partId)

  const sk1 = await api.v1.sketch.create({ id: partId, name: 'Sketch_A' })
  const sk2 = await api.v1.sketch.create({ id: partId, name: 'Sketch_B' })
  const sk3 = await api.v1.sketch.create({ id: partId, name: 'Sketch_C' })

  console.log('[04] sketch A:', sk1.result, 'maxLevel:', sk1.maxLevel)
  console.log('[04] sketch B:', sk2.result, 'maxLevel:', sk2.maxLevel)
  console.log('[04] sketch C:', sk3.result, 'maxLevel:', sk3.maxLevel)

  filewrite({
    sketchA: sk1.result,
    sketchB: sk2.result,
    sketchC: sk3.result,
  }, 'multiple-ids')

  return { partId }
}
