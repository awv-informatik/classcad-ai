// Hypothesis: adding a curve after snapshot refreshes the shape ID for translateShape
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Refresh' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test A: snapshot -> translate (no intermediate operation) — should fail
  const sA = (await api.v1.curve.shape({ id: eifId, name: 'NoRefresh' })).result
  await api.v1.curve.line({ id: sA, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  await snapshot('a-before')
  const rA = await api.v1.curve.translateShape({ id: sA, translation: [10, 0, 0] })
  console.log('[15] A no-refresh:', rA.maxLevel)

  // Test B: snapshot -> add line -> translate — should work
  const sB = (await api.v1.curve.shape({ id: eifId, name: 'WithRefresh' })).result
  await api.v1.curve.line({ id: sB, startPos: [0, 20, 0], endPos: [10, 20, 0] })
  await snapshot('b-before')
  await api.v1.curve.line({ id: sB, startPos: [10, 20, 0], endPos: [10, 30, 0] })
  const rB = await api.v1.curve.translateShape({ id: sB, translation: [10, 0, 0] })
  console.log('[15] B with-refresh:', rB.maxLevel)

  // Test C: snapshot -> setDatabaseSettings -> translate
  const sC = (await api.v1.curve.shape({ id: eifId, name: 'Settings' })).result
  await api.v1.curve.line({ id: sC, startPos: [0, 40, 0], endPos: [10, 40, 0] })
  await snapshot('c-before')
  await api.v1.common.setDatabaseSettings({ isGraphicEnabled: false })
  const rC = await api.v1.curve.translateShape({ id: sC, translation: [10, 0, 0] })
  console.log('[15] C settings-refresh:', rC.maxLevel)

  filewrite({
    noRefresh: rA.maxLevel,
    withLineRefresh: rB.maxLevel,
    withSettingsRefresh: rC.maxLevel,
  }, 'refresh-results')

  return { partId }
}
