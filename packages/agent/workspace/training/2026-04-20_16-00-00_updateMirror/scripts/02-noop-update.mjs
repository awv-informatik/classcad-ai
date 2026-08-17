export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoopTest' })).result
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
    id: partId, name: 'MirrorRight',
    targets: [boxId], references: [rightWp],
  })).result

  await snapshot('before-noop')

  // Update with NO optional params — just the required id
  await api.v1.part.openFeature({ id: mirrorId })
  const updateR = await api.v1.part.updateMirror({ id: mirrorId })
  await api.v1.part.closeFeature({ id: mirrorId })

  console.log('[02] noop result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  console.log('[02] messages:', JSON.stringify(updateR.messages))
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'noop-response')

  await snapshot('after-noop')

  return { partId, mirrorId }
}
