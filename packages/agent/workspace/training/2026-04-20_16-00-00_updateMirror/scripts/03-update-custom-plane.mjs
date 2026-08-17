export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CustomPlaneTest' })).result
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [30, 10, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 50, references: [wcs],
  })).result

  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
  const mirrorId = (await api.v1.part.mirror({
    id: partId, name: 'Mirror1',
    targets: [boxId], references: [rightWp],
  })).result

  await snapshot('before-custom')

  // Create custom work plane at x=80
  const customWp = (await api.v1.part.workPlane({
    id: partId, name: 'CustomPlane',
    origin: [80, 0, 0], normal: [1, 0, 0],
  })).result
  console.log('[03] customWp:', customWp)

  // Update mirror to use custom plane instead of Right
  await api.v1.part.openFeature({ id: mirrorId })
  const updateR = await api.v1.part.updateMirror({
    id: mirrorId, references: [customWp],
  })
  await api.v1.part.closeFeature({ id: mirrorId })

  console.log('[03] result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'custom-plane-response')

  await snapshot('after-custom')

  return { partId, mirrorId }
}
