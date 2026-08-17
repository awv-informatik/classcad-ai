export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotMulti' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 15, height: 20,
    xPosition: 30, yPosition: 0, zPosition: 0,
  })).result

  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl1',
    height: 25, diameter: 10,
    xPosition: 30, yPosition: 20, zPosition: 0,
  })).result

  // Reference body
  const refSph = (await api.v1.part.sphere({
    id: partId, name: 'Ref',
    radius: 5,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  await snapshot('before')

  const rId = (await api.v1.part.rotation({
    id: partId,
    name: 'RotMulti',
    targets: [boxId, cylId],
    references: [waZ],
    angle: 1.5708, // 90°
  })).result
  console.log('[05] multi rotation result:', rId)

  await snapshot('after-multi')

  return { partId }
}
