// Test recalc after save → clear → load cycle — is it needed? Does it change anything?
export default async function (api, { filewrite }) {
  // Create geometry
  const partId = (await api.v1.part.create({ name: 'LoadRecalc' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[04] created boxId:', boxId)

  // Save
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  console.log('[04] saved, content length:', saveRes.content.length)

  // Clear
  await api.v1.common.clear({})
  console.log('[04] cleared')

  // Load
  const loadRes = await api.v1.common.load({ data: saveRes.content, format: 'OFB', encoding: 'base64' })
  console.log('[04] loaded, result:', loadRes.result, 'maxLevel:', loadRes.maxLevel)
  filewrite({ loadResult: loadRes.result, loadMaxLevel: loadRes.maxLevel, loadMessages: loadRes.messages }, 'load-result')

  // Query state BEFORE recalc
  const beforeVersion = await api.v1.common.getAppVersion({})
  filewrite({
    structureNodeCount: JSON.stringify(beforeVersion.structure || {}).length,
    hasGraphic: !!beforeVersion.graphic
  }, 'before-recalc')

  // Recalc
  const r = await api.v1.common.recalc()
  console.log('[04] recalc result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'recalc-after-load')

  // Query state AFTER recalc
  const afterVersion = await api.v1.common.getAppVersion({})
  filewrite({
    structureNodeCount: JSON.stringify(afterVersion.structure || {}).length,
    hasGraphic: !!afterVersion.graphic
  }, 'after-recalc')

  return { loadResult: loadRes.result, recalcResult: r.result }
}
