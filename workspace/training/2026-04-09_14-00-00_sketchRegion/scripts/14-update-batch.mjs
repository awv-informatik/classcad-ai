// updateSketchRegion — batch update multiple regions at once
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchUpdate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // 3 rectangles
  const rect1 = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [30, 20, 0] })
  const rect2 = await api.v1.sketch.rectangle({ id: skId, startPos: [40, 0, 0], endPos: [70, 20, 0] })
  const rect3 = await api.v1.sketch.rectangle({ id: skId, startPos: [80, 0, 0], endPos: [110, 20, 0] })

  // Create two regions (from rect1 and rect2)
  const r1 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1.result })
  const r2 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect2.result })
  console.log('[14] region1:', r1.result, 'region2:', r2.result)

  // Batch update: swap r1 → rect2, r2 → rect3
  const upd = await api.v1.sketch.updateSketchRegion({
    regions: [
      { id: r1.result, geomIds: rect2.result },
      { id: r2.result, geomIds: rect3.result },
    ],
  })
  console.log('[14] batch update result:', upd.result, 'maxLevel:', upd.maxLevel)
  console.log('[14] messages:', JSON.stringify(upd.messages))

  filewrite({ batchResult: upd.result, maxLevel: upd.maxLevel, messages: upd.messages }, 'batch-update')

  return { partId }
}
