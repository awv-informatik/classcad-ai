export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'OrigBox', length: 50, width: 50, height: 50 })).result
  console.log('[14] boxId:', boxId)

  // Check name via common.setObjectName (read the name first using structure)
  const beforeR = await api.v1.part.box({ id: partId, name: 'Dummy' })
  // Get structure to see the names
  filewrite(beforeR.structure, 'structure-before-rename')

  // Rename via updateBox
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, name: 'NewBoxName' })
  await api.v1.part.closeFeature({ id: boxId })

  // Get structure again to verify name changed
  const afterR = await api.v1.part.box({ id: partId, name: 'Dummy2' })
  filewrite(afterR.structure, 'structure-after-rename')

  // Also test: does noop update (same value) cause issues?
  await api.v1.part.openFeature({ id: boxId })
  const noopR = await api.v1.part.updateBox({ id: boxId, height: 50 })
  console.log('[14] noop update (same value) — result:', noopR.result, 'maxLevel:', noopR.maxLevel)
  filewrite({ result: noopR.result, messages: noopR.messages, maxLevel: noopR.maxLevel }, 'noop-response')
  await api.v1.part.closeFeature({ id: boxId })

  return { partId, boxId }
}
