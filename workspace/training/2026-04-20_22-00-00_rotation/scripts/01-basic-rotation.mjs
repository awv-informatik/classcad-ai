export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotationTest' })).result

  // Non-symmetric box to see rotation clearly
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 15, height: 20,
    xPosition: 20, yPosition: 0, zPosition: 0,
  })).result

  // Reference body that stays put
  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'Ref',
    height: 5, diameter: 8,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  await snapshot('before-rotation')

  // Rotate 45 degrees around Z
  const rId = (await api.v1.part.rotation({
    id: partId,
    name: 'Rot1',
    targets: [boxId],
    references: [waZ],
    angle: 0.7854, // 45°
  })).result
  console.log('[01] rotation result:', rId)

  await snapshot('after-rotation-45deg')

  return { partId, rId }
}
