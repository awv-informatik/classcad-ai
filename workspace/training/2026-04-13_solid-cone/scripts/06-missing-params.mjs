// Missing required params — test validation order
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MissingParams' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Missing height
  const r1 = await api.v1.solid.cone({ id: eifId, bDiameter: 60, tDiameter: 20 })
  console.log('[06] no height:', r1.result, 'maxLevel:', r1.maxLevel, 'msg:', r1.messages?.[0]?.message)

  // Missing bDiameter
  const r2 = await api.v1.solid.cone({ id: eifId, height: 100, tDiameter: 20 })
  console.log('[06] no bDiam:', r2.result, 'maxLevel:', r2.maxLevel, 'msg:', r2.messages?.[0]?.message)

  // Missing tDiameter
  const r3 = await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 60 })
  console.log('[06] no tDiam:', r3.result, 'maxLevel:', r3.maxLevel, 'msg:', r3.messages?.[0]?.message)

  // Missing all three
  const r4 = await api.v1.solid.cone({ id: eifId })
  console.log('[06] no dims:', r4.result, 'maxLevel:', r4.maxLevel, 'msg:', r4.messages?.[0]?.message)

  // Wrong id type (part ID instead of EIF)
  const r5 = await api.v1.solid.cone({ id: partId, height: 100, bDiameter: 60, tDiameter: 20 })
  console.log('[06] wrong id:', r5.result, 'maxLevel:', r5.maxLevel, 'msg:', r5.messages?.[0]?.message)

  filewrite({
    noHeight: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    noBDiam: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    noTDiam: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    noDims: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    wrongId: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages }
  }, 'missing-params')

  return { partId, eifId }
}
