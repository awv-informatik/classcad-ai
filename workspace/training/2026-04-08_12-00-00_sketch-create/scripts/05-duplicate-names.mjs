// Test: creating sketches with duplicate names
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  const sk1 = await api.v1.sketch.create({ id: partId, name: 'SameName' })
  const sk2 = await api.v1.sketch.create({ id: partId, name: 'SameName' })
  const sk3 = await api.v1.sketch.create({ id: partId, name: 'SameName' })

  console.log('[05] sketch1:', sk1.result, 'maxLevel:', sk1.maxLevel)
  console.log('[05] sketch2:', sk2.result, 'maxLevel:', sk2.maxLevel)
  console.log('[05] sketch3:', sk3.result, 'maxLevel:', sk3.maxLevel)

  // Are IDs different despite same name?
  console.log('[05] all different IDs:', sk1.result !== sk2.result && sk2.result !== sk3.result)

  filewrite({
    id1: sk1.result,
    id2: sk2.result,
    id3: sk3.result,
    allDifferent: sk1.result !== sk2.result && sk2.result !== sk3.result,
  }, 'duplicate-names')

  return { partId }
}
