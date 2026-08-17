export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TransMulti' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 25,
  })).result

  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl1',
    height: 30, diameter: 15,
    xPosition: 0, yPosition: 30, zPosition: 0,
  })).result

  // Reference body that stays put
  const refSph = (await api.v1.part.sphere({
    id: partId, name: 'RefSph',
    radius: 5,
    xPosition: -20, yPosition: 0, zPosition: 0,
  })).result

  const waX = (await api.v1.part.workAxis({
    id: partId, name: 'AxisX',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  await snapshot('before')

  const tId = (await api.v1.part.translation({
    id: partId,
    name: 'TransMulti',
    targets: [boxId, cylId],
    references: [waX],
    distance: 60,
  })).result
  console.log('[05] multi-target result:', tId)

  await snapshot('after-multi')

  return { partId }
}
