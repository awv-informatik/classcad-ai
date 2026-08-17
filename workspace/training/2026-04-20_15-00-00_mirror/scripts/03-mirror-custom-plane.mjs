export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorCustom' })).result

  // Create a box offset from origin using a workCSys
  const wcsId = (await api.v1.part.workCSys({
    id: partId,
    name: 'WCS1',
    origin: [30, 0, 0],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })).result

  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: 40,
    width: 30,
    height: 50,
    references: [wcsId],
  })).result
  console.log('[03] boxId:', boxId)

  // Create a custom work plane at x=100
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'MirrorPlane',
    normal: [1, 0, 0],
    position: [100, 0, 0],
  })).result
  console.log('[03] wpId:', wpId)

  await snapshot('before-custom-mirror')

  // Mirror across custom plane
  const r = await api.v1.part.mirror({
    id: partId,
    targets: [boxId],
    references: [wpId],
  })
  console.log('[03] mirrorId:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-custom-mirror')

  return { partId, boxId, mirrorId: r.result }
}
