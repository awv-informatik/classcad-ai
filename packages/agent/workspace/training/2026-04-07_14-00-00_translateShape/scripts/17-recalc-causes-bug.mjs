// Test: is v1.common.recalc the root cause of shape ID invalidation?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test A: recalc -> translate
  const sA = (await api.v1.curve.shape({ id: eifId, name: 'RecalcA' })).result
  await api.v1.curve.line({ id: sA, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  await api.v1.common.recalc({})
  const rA = await api.v1.curve.translateShape({ id: sA, translation: [10, 0, 0] })
  console.log('[17] A recalc->translate:', rA.maxLevel, JSON.stringify(rA.messages))

  // Test B: no recalc -> translate (control)
  const sB = (await api.v1.curve.shape({ id: eifId, name: 'ControlB' })).result
  await api.v1.curve.line({ id: sB, startPos: [0, 20, 0], endPos: [10, 20, 0] })
  const rB = await api.v1.curve.translateShape({ id: sB, translation: [10, 0, 0] })
  console.log('[17] B control:', rB.maxLevel)

  // Test C: recalc -> add curve -> translate (refreshes?)
  const sC = (await api.v1.curve.shape({ id: eifId, name: 'RecalcRefresh' })).result
  await api.v1.curve.line({ id: sC, startPos: [0, 40, 0], endPos: [10, 40, 0] })
  await api.v1.common.recalc({})
  await api.v1.curve.line({ id: sC, startPos: [10, 40, 0], endPos: [10, 50, 0] })
  const rC = await api.v1.curve.translateShape({ id: sC, translation: [10, 0, 0] })
  console.log('[17] C recalc+refresh:', rC.maxLevel)

  filewrite({
    recalcThenTranslate: rA.maxLevel,
    control: rB.maxLevel,
    recalcRefresh: rC.maxLevel,
  }, 'recalc-results')

  return { partId }
}
