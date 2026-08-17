// 17 — Clean parametric link test with reference body and structure inspection
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ParamClean' })).result

  // Create a part-level box (80x60x40) as source
  const boxFeat = (await api.v1.part.box({ id: partId, name: 'SrcBox', length: 80, width: 60, height: 40 })).result

  // Create EI for useSolid destination
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI' })).result
  const r = await api.v1.solid.useSolid({ from: [boxFeat], in: eifId })
  const usedId = r.result[0]

  // Add a reference sphere (radius 15, fixed size) in the same EI
  const refSphere = (await api.v1.solid.sphere({ id: eifId, radius: 15, translation: [0, 80, 20] })).result

  // Move the useSolid'd box aside for visual clarity
  await api.v1.solid.translation({ id: eifId, target: usedId, translation: [120, 0, 0] })

  // Snapshot BEFORE update — both boxes should be 80x60x40
  await snapshot('before')

  // Dump structure tree before update for inspection
  const structBefore = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' }))
  filewrite(structBefore.structure, 'structure-before')

  // Update source box to height=100
  await api.v1.part.openFeature({ id: boxFeat })
  const upd = await api.v1.part.updateBox({ id: boxFeat, height: 100 })
  console.log('[17] updateBox maxLevel:', upd.maxLevel)
  await api.v1.part.closeFeature({ id: boxFeat })
  await api.v1.common.recalc({})

  // Snapshot AFTER update — check if useSolid'd box also got taller
  await snapshot('after')

  // Dump structure tree after update
  const structAfter = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' }))
  filewrite(structAfter.structure, 'structure-after')

  console.log('[17] boxFeat:', boxFeat, 'usedId:', usedId, 'refSphere:', refSphere)
  return { boxFeat, usedId, refSphere }
}
