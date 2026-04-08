// Verify translation with graphic data from setDatabaseSettings response
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerifyPos' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Shape' })).result

  // Create a line from (0,0,0) to (10,5,0)
  const lineR = await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [10, 5, 0] })
  console.log('[11] line created, maxLevel:', lineR.maxLevel)

  // Enable graphics and get graphic data
  const gfxOn = await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: true,
    doCurveTessellation: true,
  })
  filewrite(gfxOn.graphic, 'graphic-after-line')

  // Translate
  const tr = await api.v1.curve.translateShape({ id: s1, translation: [20, 30, 0] })
  console.log('[11] translate maxLevel:', tr.maxLevel)
  filewrite(tr.graphic, 'graphic-after-translate')

  // Also check: does the translateShape response itself have useful graphic data?
  console.log('[11] translate graphic null?', tr.graphic === null)
  console.log('[11] translate graphic keys:', tr.graphic ? Object.keys(tr.graphic) : 'null')

  // Add reference line (not translated) to see both in snapshot
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: s2, startPos: [0, 0, 0], endPos: [10, 5, 0] })

  await snapshot('translated-vs-ref')
  return { partId }
}
