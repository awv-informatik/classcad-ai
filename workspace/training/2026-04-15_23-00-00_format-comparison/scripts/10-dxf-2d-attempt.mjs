// DXF docs say "Can only be used to write 2d geometry"
// Test with a 2D sketch (curves only, no solids)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DxfTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create 2D curves via shape
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'DxfShape' })).result
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [100, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [100, 0, 0], endPos: [100, 50, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [100, 50, 0], endPos: [0, 50, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, 50, 0], endPos: [0, 0, 0] })

  console.log('[10] Created 2D shape with 4 lines')

  // Attempt DXF save with 2D-only content
  const r = await api.v1.common.save({ format: 'DXF', encoding: 'base64' })
  console.log('[10] DXF save with 2D geometry — success:', r.result?.success, 'maxLevel:', r.maxLevel)
  console.log('[10] DXF content length:', r.result?.content?.length || 0)
  if (r.messages?.length) {
    r.messages.forEach(m => console.log('[10] msg:', m.message))
  }

  // Also test with a sketch (not entity injection curves)
  const partId2 = (await api.v1.part.create({ name: 'DxfSketch' })).result
  const skId = (await api.v1.sketch.create({ id: partId2 })).result
  await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [100, 50, 0] })

  const r2 = await api.v1.common.save({ format: 'DXF', encoding: 'base64' })
  console.log('[10] DXF save with sketch — success:', r2.result?.success, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    r2.messages.forEach(m => console.log('[10] sketch msg:', m.message))
  }

  filewrite({
    curvesDxf: {
      success: r.result?.success,
      contentLength: r.result?.content?.length || 0,
      maxLevel: r.maxLevel,
      messages: r.messages?.map(m => m.message),
    },
    sketchDxf: {
      success: r2.result?.success,
      contentLength: r2.result?.content?.length || 0,
      maxLevel: r2.maxLevel,
      messages: r2.messages?.map(m => m.message),
    },
  }, 'dxf-2d')

  return { partId }
}
