// Test recalc after clear with keepIds — is it safe?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ClearKeepTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const box1 = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 20, height: 15, translation: [70, 0, 0] })).result
  console.log('[09] box1:', box1, 'box2:', box2)

  // Clear but keep box1
  const clearR = await api.v1.common.clear({ keepIds: [box1] })
  console.log('[09] clear result:', clearR.result, 'maxLevel:', clearR.maxLevel)

  // Recalc after partial clear
  const recalcR = await api.v1.common.recalc()
  console.log('[09] recalc result:', recalcR.result, 'maxLevel:', recalcR.maxLevel)
  console.log('[09] recalc messages:', JSON.stringify(recalcR.messages))

  filewrite({
    clearResult: { result: clearR.result, maxLevel: clearR.maxLevel, messages: clearR.messages },
    recalcResult: { result: recalcR.result, maxLevel: recalcR.maxLevel, messages: recalcR.messages }
  }, 'clear-keepids-recalc')

  return { clearMaxLevel: clearR.maxLevel, recalcMaxLevel: recalcR.maxLevel }
}
