// Test getSketch finds sketches created via both sketch.create and part.sketch
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create via sketch.create
  const sk1 = (await api.v1.sketch.create({ id: partId, name: 'ViaSketchCreate' })).result
  console.log('[09] via sketch.create id:', sk1)

  // Create via part.sketch
  const sk2 = (await api.v1.part.sketch({ id: partId, name: 'ViaPartSketch' })).result
  console.log('[09] via part.sketch id:', sk2)

  // Look up both
  const r1 = await api.v1.part.getSketch({ id: partId, name: 'ViaSketchCreate' })
  const r2 = await api.v1.part.getSketch({ id: partId, name: 'ViaPartSketch' })
  console.log('[09] found ViaSketchCreate:', r1.result, 'match:', r1.result === sk1)
  console.log('[09] found ViaPartSketch:', r2.result, 'match:', r2.result === sk2)

  filewrite({
    sketchCreate: { created: sk1, found: r1.result, match: r1.result === sk1 },
    partSketch: { created: sk2, found: r2.result, match: r2.result === sk2 },
  }, 'create-method-response')

  return { partId }
}
