// Test getSketchRegion with multiple named regions — verify each can be looked up independently
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create three separate rectangles
  const rect1 = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [30, 20, 0] })).result
  const rect2 = (await api.v1.sketch.rectangle({ id: skId, startPos: [40, 0, 0], endPos: [70, 20, 0] })).result
  const rect3 = (await api.v1.sketch.rectangle({ id: skId, startPos: [80, 0, 0], endPos: [110, 20, 0] })).result

  // Create named regions
  const reg1 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1, name: 'Left' })).result
  const reg2 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect2, name: 'Center' })).result
  const reg3 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect3, name: 'Right' })).result
  console.log('[08] created:', reg1, reg2, reg3)

  // Look up each
  const r1 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Left' })
  const r2 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Center' })
  const r3 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Right' })

  console.log('[08] Left:', r1.result, 'match:', r1.result === reg1)
  console.log('[08] Center:', r2.result, 'match:', r2.result === reg2)
  console.log('[08] Right:', r3.result, 'match:', r3.result === reg3)

  filewrite({
    created: { reg1, reg2, reg3 },
    lookups: {
      Left: { result: r1.result, match: r1.result === reg1 },
      Center: { result: r2.result, match: r2.result === reg2 },
      Right: { result: r3.result, match: r3.result === reg3 },
    }
  }, 'multiple-regions')

  return { partId }
}
