export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTargets' })).result

  const wcs1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [20, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1', length: 30, width: 25, height: 40, references: [wcs1],
  })).result

  const wcs2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS2',
    origin: [20, 40, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl1', radius: 12, height: 35, references: [wcs2],
  })).result

  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result

  // Mirror just the box initially
  const mirrorId = (await api.v1.part.mirror({
    id: partId, name: 'Mirror1',
    targets: [boxId],
    references: [rightWp],
  })).result
  console.log('[10] mirrorId:', mirrorId)

  await snapshot('mirror-box-only')

  // Update: change name and add cylinder to targets
  await api.v1.part.openFeature({ id: mirrorId })
  const r = await api.v1.part.updateMirror({
    id: mirrorId,
    name: 'MirrorBoth',
    targets: [boxId, cylId],
  })
  console.log('[10] update result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[10] messages:', JSON.stringify(r.messages))
  await api.v1.part.closeFeature({ id: mirrorId })

  await snapshot('mirror-both-updated')

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'update-targets')

  return { partId, boxId, cylId, mirrorId }
}
