export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateMirror' })).result

  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [20, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1', length: 30, width: 25, height: 40, references: [wcs],
  })).result

  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
  const frontWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result

  const mirrorId = (await api.v1.part.mirror({
    id: partId, name: 'Mirror1',
    targets: [boxId],
    references: [rightWp],
  })).result
  console.log('[09] mirrorId:', mirrorId)

  await snapshot('before-update')

  // Try updateMirror WITHOUT openFeature first
  const r1 = await api.v1.part.updateMirror({
    id: mirrorId,
    references: [frontWp],
  })
  console.log('[09] updateMirror without open:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[09] messages:', JSON.stringify(r1.messages))

  await snapshot('after-update-no-open')

  // Now try with openFeature/closeFeature
  await api.v1.part.openFeature({ id: mirrorId })
  const r2 = await api.v1.part.updateMirror({
    id: mirrorId,
    references: [frontWp],
  })
  console.log('[09] updateMirror with open:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[09] messages2:', JSON.stringify(r2.messages))
  await api.v1.part.closeFeature({ id: mirrorId })

  await snapshot('after-update-with-open')

  filewrite({ withoutOpen: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    withOpen: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'update-comparison')

  return { partId, boxId, mirrorId }
}
