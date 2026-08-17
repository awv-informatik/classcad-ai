// 14 — Is useSolid a parametric link? If the source is modified, does the useSolid'd copy update?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ParamLink' })).result

  // Create a part-level box
  const boxFeat = (await api.v1.part.box({ id: partId, name: 'SrcBox', length: 80, width: 60, height: 40 })).result
  console.log('[14] box feature:', boxFeat)

  // useSolid into EI
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI' })).result
  const r = await api.v1.solid.useSolid({ from: [boxFeat], in: eifId })
  const usedId = r.result[0]
  console.log('[14] useSolid ID:', usedId)

  // Snapshot before modification
  await snapshot('before-update')

  // Get graphic data for the used solid before modification
  const gBefore = await api.v1.solid.box({ id: (await api.v1.part.entityInjection({ id: partId, name: 'Dummy' })).result, length: 1, width: 1, height: 1 })
  // Actually, let me just measure via a recalc

  // Now update the source box to be taller
  await api.v1.part.openFeature({ id: boxFeat })
  const upd = await api.v1.part.updateBox({ id: boxFeat, height: 100 })
  console.log('[14] updateBox result:', upd.result, 'maxLevel:', upd.maxLevel)
  await api.v1.part.closeFeature({ id: boxFeat })

  // Recalc
  await api.v1.common.recalc({})

  // Snapshot after modification — does the useSolid'd solid change too?
  await snapshot('after-update')

  // Try to operate on the useSolid'd ID — is it still valid?
  const tr = await api.v1.solid.translation({ id: eifId, target: usedId, translation: [100, 0, 0] })
  console.log('[14] translate used ID after source update: result:', tr.result, 'maxLevel:', tr.maxLevel)
  filewrite({ updateResult: upd.result, translateResult: tr.result, translateMaxLevel: tr.maxLevel }, 'parametric-link')

  await snapshot('after-translate')
  return { boxFeat, usedId }
}
