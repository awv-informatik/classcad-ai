export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TargetsObjTest' })).result

  // Create two boxes at different positions
  const wcs1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [20, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const box1 = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 25, height: 40, references: [wcs1],
  })).result

  const wcs2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS2',
    origin: [20, 40, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const box2 = (await api.v1.part.box({
    id: partId, name: 'Box2',
    length: 20, width: 15, height: 60, references: [wcs2],
  })).result

  console.log('[05] box1:', box1, 'box2:', box2)

  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result

  // Create mirror with box1 only
  const mirrorId = (await api.v1.part.mirror({
    id: partId, name: 'Mirror1',
    targets: [box1], references: [rightWp],
  })).result
  console.log('[05] mirrorId:', mirrorId)

  await snapshot('before-add-target')

  // Update: change targets to both boxes using object format
  await api.v1.part.openFeature({ id: mirrorId })
  const updateR = await api.v1.part.updateMirror({
    id: mirrorId,
    targets: [{ id: box1 }, { id: box2 }],
  })
  await api.v1.part.closeFeature({ id: mirrorId })

  console.log('[05] result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'add-target-response')

  await snapshot('after-add-target')

  return { partId, mirrorId }
}
