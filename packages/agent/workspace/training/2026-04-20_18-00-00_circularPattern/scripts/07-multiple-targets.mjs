export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiTargetTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 10, height: 30,
    xPosition: 40, yPosition: 0, zPosition: 0,
  })).result

  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl1',
    height: 40, diameter: 8,
    xPosition: 40, yPosition: 15, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  await snapshot('before-pattern')

  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_multi',
    targets: [boxId, cylId],
    references: [waZ],
    angle: 1.5708, // 90 degrees
    count: 4,
  })
  console.log('[07] multi-target: result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('multi-target-pattern')

  return { partId }
}
