// Verify translation actually moves geometry by comparing graphic data before/after
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerifyPos' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Shape' })).result

  // Create a simple line from (0,0,0) to (10,5,0)
  await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [10, 5, 0] })

  // Get graphic data before translation
  const beforeR = await api.v1.common.setDatabaseSettings({ isGraphicEnabled: true, doCurveTessellation: true })
  // Need to trigger a graphic update — let's try getting structure
  const before = await api.v1.part.entityInjection({ id: partId })
  filewrite(before.graphic, 'graphic-before')

  // Translate by [20, 30, 0]
  const tr = await api.v1.curve.translateShape({ id: s1, translation: [20, 30, 0] })
  console.log('[10] translate:', tr.maxLevel)

  // Get graphic data after
  // Force graphic refresh by calling a query
  const after = await api.v1.common.setDatabaseSettings({ isGraphicEnabled: true, doCurveTessellation: true })
  const afterEi = await api.v1.part.entityInjection({ id: partId })
  filewrite(afterEi.graphic, 'graphic-after')

  // Also create a second shape for reference (not translated)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: s2, startPos: [0, 0, 0], endPos: [10, 5, 0] })

  await snapshot('translated-vs-ref')

  return { partId }
}
