// 06 — Do graphic flags affect what r.graphic returns from API calls?
export default async function (api, { filewrite }) {
  // Create geometry
  const partId = (await api.v1.part.create({ name: 'GraphicTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // With default settings (graphic enabled)
  const db1 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[06] Initial isGraphicEnabled:', db1.isGraphicEnabled)

  const boxR1 = await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })
  const hasGraphic1 = boxR1.graphic !== null && boxR1.graphic !== undefined
  const graphicSize1 = hasGraphic1 ? JSON.stringify(boxR1.graphic).length : 0
  console.log('[06] With graphic enabled: hasGraphic:', hasGraphic1, 'size:', graphicSize1)

  // Disable graphics
  await api.v1.common.setDatabaseSettings({ isGraphicEnabled: false })
  const db2 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[06] After disable: isGraphicEnabled:', db2.isGraphicEnabled)

  // Create another box to see if graphic data is absent
  const box2R = await api.v1.solid.box({ id: eifId, length: 30, width: 20, height: 10, translation: [60, 0, 0] })
  const hasGraphic2 = box2R.graphic !== null && box2R.graphic !== undefined
  const graphicSize2 = hasGraphic2 ? JSON.stringify(box2R.graphic).length : 0
  console.log('[06] With graphic disabled: hasGraphic:', hasGraphic2, 'size:', graphicSize2)

  // Re-enable
  await api.v1.common.setDatabaseSettings({ isGraphicEnabled: true })

  filewrite({
    withGraphic: { hasGraphic: hasGraphic1, size: graphicSize1 },
    withoutGraphic: { hasGraphic: hasGraphic2, size: graphicSize2 },
    settings: { before: db1, after: db2 }
  }, 'graphic-flags')

  return { hasGraphic1, graphicSize1, hasGraphic2, graphicSize2 }
}
