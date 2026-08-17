// Verify that setAppearance actually stores color/transparency by inspecting the structure tree
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerifyStorage' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Get structure before appearance change
  const beforeRecalc = await api.v1.common.recalc({})
  const beforeStruct = beforeRecalc.structure
  filewrite(beforeStruct, 'structure-before')

  // Set red color with 50% transparency
  const r = await api.v1.common.setAppearance({ target: eifId, color: [255, 0, 0], transparency: 0.5 })
  console.log('[02] setAppearance result:', r.result, 'maxLevel:', r.maxLevel)

  // Get structure after appearance change
  const afterRecalc = await api.v1.common.recalc({})
  const afterStruct = afterRecalc.structure
  filewrite(afterStruct, 'structure-after')

  // Also check graphic data for color info
  const graphicData = afterRecalc.graphic
  filewrite(graphicData, 'graphic-after')

  return { partId, eifId, boxId }
}
