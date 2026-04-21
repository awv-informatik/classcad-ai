export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorMulti' })).result

  // Create two features to mirror together
  const wcs1 = (await api.v1.part.workCSys({
    id: partId,
    name: 'WCS1',
    origin: [20, 0, 0],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })).result

  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: 30,
    width: 25,
    height: 40,
    references: [wcs1],
  })).result

  const wcs2 = (await api.v1.part.workCSys({
    id: partId,
    name: 'WCS2',
    origin: [20, 40, 0],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })).result

  const cylId = (await api.v1.part.cylinder({
    id: partId,
    name: 'Cyl1',
    radius: 10,
    height: 30,
    references: [wcs2],
  })).result
  console.log('[05] boxId:', boxId, 'cylId:', cylId)

  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result

  await snapshot('before-multi-mirror')

  // Mirror both features at once
  const r = await api.v1.part.mirror({
    id: partId,
    name: 'MirrorBoth',
    targets: [boxId, cylId],
    references: [rightWp],
  })
  console.log('[05] mirrorId:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-multi-mirror')

  return { partId, boxId, cylId, mirrorId: r.result }
}
