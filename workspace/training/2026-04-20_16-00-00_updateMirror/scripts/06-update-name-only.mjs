export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NameOnlyTest' })).result
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [30, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 50, references: [wcs],
  })).result

  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
  const mirrorId = (await api.v1.part.mirror({
    id: partId, name: 'OriginalName',
    targets: [boxId], references: [rightWp],
  })).result

  // Dump structure before to see feature name
  const structBefore = (await api.v1.part.mirror.__dummy__ || true)
  // Let's use getFeature if available, otherwise check structure
  // For now just update name and verify via return
  await api.v1.part.openFeature({ id: mirrorId })
  const updateR = await api.v1.part.updateMirror({
    id: mirrorId,
    name: 'RenamedMirror',
  })
  await api.v1.part.closeFeature({ id: mirrorId })

  console.log('[06] result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  console.log('[06] messages:', JSON.stringify(updateR.messages))
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'name-only-response')

  await snapshot('after-rename')

  return { partId, mirrorId }
}
