export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateMirrorTest' })).result

  // Create a box offset in +X so mirror across Right (YZ) is visible
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [30, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 50,
    references: [wcs],
  })).result
  console.log('[01] boxId:', boxId, 'wcs:', wcs)

  // Get built-in work planes
  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
  const frontWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
  console.log('[01] rightWp:', rightWp, 'frontWp:', frontWp)

  // Create mirror across Right
  const mirrorId = (await api.v1.part.mirror({
    id: partId, name: 'MirrorRight',
    targets: [boxId],
    references: [rightWp],
  })).result
  console.log('[01] mirrorId:', mirrorId)

  await snapshot('before-update')

  // Now update: change references from Right to Front
  await api.v1.part.openFeature({ id: mirrorId })
  const updateR = await api.v1.part.updateMirror({
    id: mirrorId,
    references: [frontWp],
  })
  await api.v1.part.closeFeature({ id: mirrorId })

  console.log('[01] updateMirror result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  console.log('[01] updateMirror messages:', JSON.stringify(updateR.messages))
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-response')

  await snapshot('after-update')

  return { partId, mirrorId }
}
