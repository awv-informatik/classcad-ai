// Test getSketch with the default sketch name ("Sketch") when no name is provided
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create sketch with no name (gets default name)
  const sk1 = (await api.v1.part.sketch({ id: partId })).result
  console.log('[11] unnamed sketch id:', sk1)

  // What's the default name? Try "Sketch"
  const r1 = await api.v1.part.getSketch({ id: partId, name: 'Sketch' })
  console.log('[11] getSketch("Sketch"):', r1.result, 'match:', r1.result === sk1)

  // Create another unnamed sketch — what name does it get?
  const sk2 = (await api.v1.part.sketch({ id: partId })).result
  console.log('[11] second unnamed sketch id:', sk2)

  // Try common naming patterns
  const r2 = await api.v1.part.getSketch({ id: partId, name: 'Sketch' })
  const r3 = await api.v1.part.getSketch({ id: partId, name: 'Sketch1' })
  const r4 = await api.v1.part.getSketch({ id: partId, name: 'Sketch_1' })
  const r5 = await api.v1.part.getSketch({ id: partId, name: 'Sketch 2' })
  const r6 = await api.v1.part.getSketch({ id: partId, name: 'Sketch2' })
  const r7 = await api.v1.part.getSketch({ id: partId, name: 'Sketch_2' })

  console.log('[11] "Sketch":', r2.result)
  console.log('[11] "Sketch1":', r3.result)
  console.log('[11] "Sketch_1":', r4.result)
  console.log('[11] "Sketch 2":', r5.result)
  console.log('[11] "Sketch2":', r6.result)
  console.log('[11] "Sketch_2":', r7.result)

  filewrite({
    sk1Id: sk1, sk2Id: sk2,
    nameGuesses: {
      'Sketch': r2.result, 'Sketch1': r3.result, 'Sketch_1': r4.result,
      'Sketch 2': r5.result, 'Sketch2': r6.result, 'Sketch_2': r7.result,
    },
  }, 'default-name-response')

  return { partId }
}
