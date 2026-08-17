// 13 — Dig into the graphic data difference when isGraphicEnabled is toggled
// Script 06 showed graphic data is still returned when disabled — investigate the structure
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GfxDetailTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Ensure graphic is enabled
  await api.v1.common.setDatabaseSettings({ isGraphicEnabled: true })

  const boxR1 = await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })
  filewrite(boxR1.graphic, 'graphic-enabled')

  // Disable
  await api.v1.common.setDatabaseSettings({ isGraphicEnabled: false })
  const boxR2 = await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30, translation: [60, 0, 0] })
  filewrite(boxR2.graphic, 'graphic-disabled')

  // Compare top-level keys and container counts
  const g1 = boxR1.graphic
  const g2 = boxR2.graphic
  console.log('[13] Graphic-ON  keys:', Object.keys(g1).join(','))
  console.log('[13] Graphic-OFF keys:', Object.keys(g2).join(','))
  console.log('[13] Graphic-ON  containers:', g1.containers?.length)
  console.log('[13] Graphic-OFF containers:', g2.containers?.length)

  if (g1.containers && g2.containers) {
    for (let i = 0; i < Math.max(g1.containers.length, g2.containers.length); i++) {
      const c1 = g1.containers[i]
      const c2 = g2.containers[i]
      console.log(`[13] Container[${i}] ON keys:`, c1 ? Object.keys(c1).join(',') : 'ABSENT')
      console.log(`[13] Container[${i}] OFF keys:`, c2 ? Object.keys(c2).join(',') : 'ABSENT')
      if (c1?.meshes) console.log(`[13] Container[${i}] ON meshes:`, c1.meshes.length)
      if (c2?.meshes) console.log(`[13] Container[${i}] OFF meshes:`, c2.meshes.length)
      if (c1?.edges) console.log(`[13] Container[${i}] ON edges:`, c1.edges.length)
      if (c2?.edges) console.log(`[13] Container[${i}] OFF edges:`, c2.edges.length)
    }
  }

  // Restore
  await api.v1.common.setDatabaseSettings({ isGraphicEnabled: true })

  return {}
}
