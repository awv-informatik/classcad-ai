// Test whether solid IDs survive recalc (unlike shape IDs)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SolidIdSurvival' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result
  console.log('[07] boxId:', boxId)

  // Translate box BEFORE recalc — should work
  const t1 = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [10, 0, 0] })
  console.log('[07] translate before recalc: maxLevel=', t1.maxLevel, 'result:', t1.result)

  // Recalc
  const r = await api.v1.common.recalc()
  console.log('[07] recalc: maxLevel=', r.maxLevel)

  // Translate AFTER recalc — should still work (unlike shape IDs)
  const t2 = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [10, 0, 0] })
  console.log('[07] translate after recalc: maxLevel=', t2.maxLevel, 'result:', t2.result)

  filewrite({
    beforeRecalc: { maxLevel: t1.maxLevel, result: t1.result },
    recalc: { maxLevel: r.maxLevel },
    afterRecalc: { maxLevel: t2.maxLevel, result: t2.result }
  }, 'solid-id-survival')

  return { solidIdSurvives: t2.maxLevel <= 31 }
}
