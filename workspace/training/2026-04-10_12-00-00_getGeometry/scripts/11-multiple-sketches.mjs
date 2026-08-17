// Test that getGeometry returns geometry only from the specified sketch, not others
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create two sketches
  const sk1 = (await api.v1.sketch.create({ id: partId })).result
  const sk2 = (await api.v1.sketch.create({ id: partId })).result

  // Add geometry to sketch 1
  await api.v1.sketch.line({ id: sk1, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  await api.v1.sketch.circle({ id: sk1, centerPos: [25, 25, 0], radius: 10 })

  // Add geometry to sketch 2
  await api.v1.sketch.line({ id: sk2, startPos: [10, 10, 0], endPos: [70, 10, 0] })

  const r1 = await api.v1.sketch.getGeometry({ id: sk1 })
  const r2 = await api.v1.sketch.getGeometry({ id: sk2 })

  console.log('[11] sketch1:', JSON.stringify(r1.result))
  console.log('[11] sketch2:', JSON.stringify(r2.result))

  filewrite({
    sketch1: r1.result,
    sketch2: r2.result,
    sk1LineCount: r1.result.lines?.length,
    sk1CircleCount: r1.result.circles?.length,
    sk2LineCount: r2.result.lines?.length,
    sk2CircleCount: r2.result.circles?.length,
  }, 'two-sketches')

  return { partId }
}
