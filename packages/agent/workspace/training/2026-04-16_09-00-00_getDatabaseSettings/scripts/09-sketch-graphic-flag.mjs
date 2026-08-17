// 09 — What does isSketchGraphicEnabled actually do? Does it suppress sketch graphic data?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SkGfxTest' })).result

  // Create sketch with graphic enabled
  const db1 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[09] isSketchGraphicEnabled:', db1.isSketchGraphicEnabled)

  const sk1R = await api.v1.sketch.create({ id: partId })
  const sk1Id = sk1R.result
  const hasGfx1 = sk1R.graphic !== null && sk1R.graphic !== undefined
  console.log('[09] sketch.create with sketch gfx on: hasGraphic:', hasGfx1)

  const lineR1 = await api.v1.sketch.line({ id: sk1Id, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const hasGfx1Line = lineR1.graphic !== null && lineR1.graphic !== undefined
  const gfxSize1 = hasGfx1Line ? JSON.stringify(lineR1.graphic).length : 0
  console.log('[09] sketch.line with sketch gfx on: hasGraphic:', hasGfx1Line, 'size:', gfxSize1)

  // Disable sketch graphic
  await api.v1.common.setDatabaseSettings({ isSketchGraphicEnabled: false })
  const db2 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[09] After disable: isSketchGraphicEnabled:', db2.isSketchGraphicEnabled)

  const lineR2 = await api.v1.sketch.line({ id: sk1Id, startPos: [0, 10, 0], endPos: [50, 10, 0] })
  const hasGfx2Line = lineR2.graphic !== null && lineR2.graphic !== undefined
  const gfxSize2 = hasGfx2Line ? JSON.stringify(lineR2.graphic).length : 0
  console.log('[09] sketch.line with sketch gfx off: hasGraphic:', hasGfx2Line, 'size:', gfxSize2)

  // Restore
  await api.v1.common.setDatabaseSettings({ isSketchGraphicEnabled: true })

  filewrite({
    withSketchGfx: { hasGraphic: hasGfx1Line, size: gfxSize1 },
    withoutSketchGfx: { hasGraphic: hasGfx2Line, size: gfxSize2 }
  }, 'sketch-graphic')

  return { gfxSize1, gfxSize2 }
}
