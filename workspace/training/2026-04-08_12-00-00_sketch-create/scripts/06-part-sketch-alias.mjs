// Test: part.sketch alias — same signature as sketch.create?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  // Create via sketch.create
  const r1 = await api.v1.sketch.create({ id: partId, name: 'ViaSketchCreate' })
  console.log('[06] sketch.create result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Create via part.sketch
  const r2 = await api.v1.part.sketch({ id: partId, name: 'ViaPartSketch' })
  console.log('[06] part.sketch result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    sketchCreate: { result: r1.result, maxLevel: r1.maxLevel },
    partSketch: { result: r2.result, maxLevel: r2.maxLevel },
  }, 'alias-comparison')

  return { partId }
}
