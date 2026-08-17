// Test requestVisualisation to check if we can observe appearance data
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RequestVisTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Set distinctive color
  await api.v1.common.setAppearance({ target: eifId, color: [255, 0, 0], transparency: 0.5 })

  // Try requestVisualisation
  const r1 = await api.v1.common.requestVisualisation({ ids: [boxId] })
  console.log('[14] requestVis(boxId) result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'vis-boxId')

  // Also try with the graphic data
  if (r1.graphic) {
    filewrite(r1.graphic, 'vis-graphic')
  } else {
    console.log('[14] no graphic data in requestVis response')
  }

  // Try with eifId
  const r2 = await api.v1.common.requestVisualisation({ ids: [eifId] })
  console.log('[14] requestVis(eifId) result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'vis-eifId')

  // Try with partId
  const r3 = await api.v1.common.requestVisualisation({ ids: [partId] })
  console.log('[14] requestVis(partId) result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'vis-partId')

  // Check if graphic envelope from requestVis has color data
  if (r1.graphic) {
    const graphicKeys = Object.keys(r1.graphic)
    console.log('[14] graphic keys:', graphicKeys)
  }

  return { partId }
}
