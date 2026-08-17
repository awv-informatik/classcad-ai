export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TransWP' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 25,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    height: 5, diameter: 10,
  })).result

  // Two work points define direction
  const wp1 = (await api.v1.part.workPoint({
    id: partId, name: 'WP1',
    position: [0, 0, 0],
  })).result

  const wp2 = (await api.v1.part.workPoint({
    id: partId, name: 'WP2',
    position: [50, 30, 0],
  })).result

  const tId = (await api.v1.part.translation({
    id: partId,
    name: 'TransWP',
    targets: [boxId],
    references: [wp1, wp2],
    distance: 50,
  })).result
  console.log('[04] workpoints translation result:', tId)

  await snapshot('workpoints-translation')

  return { partId }
}
