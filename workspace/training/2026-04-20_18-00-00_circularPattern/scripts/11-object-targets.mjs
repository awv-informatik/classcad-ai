export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ObjTargetTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 30,
    xPosition: 50, yPosition: 0, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  // Object format for targets — { id: featureId }
  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_objtarget',
    targets: [{ id: boxId }],
    references: [waZ],
    angle: 1.5708,
    count: 4,
  })
  console.log('[11] object targets: result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('obj-target-pattern')

  return { partId }
}
