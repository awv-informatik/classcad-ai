// Test: part.getSketch with duplicate names — which one is returned?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  const sk1 = await api.v1.sketch.create({ id: partId, name: 'DupeName' })
  const sk2 = await api.v1.sketch.create({ id: partId, name: 'DupeName' })
  const sk3 = await api.v1.sketch.create({ id: partId, name: 'DupeName' })

  console.log('[08] sk1:', sk1.result, 'sk2:', sk2.result, 'sk3:', sk3.result)

  const found = await api.v1.part.getSketch({ id: partId, name: 'DupeName' })
  console.log('[08] getSketch returns:', found.result)
  console.log('[08] matches first:', found.result === sk1.result)
  console.log('[08] matches second:', found.result === sk2.result)
  console.log('[08] matches third:', found.result === sk3.result)

  filewrite({
    ids: [sk1.result, sk2.result, sk3.result],
    found: found.result,
    matchesFirst: found.result === sk1.result,
  }, 'get-sketch-duplicates')

  return { partId }
}
