export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircPatternTest' })).result

  // Create a box offset from origin to see circular pattern clearly
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 30,
    xPosition: 50, yPosition: 0, zPosition: 0,
  })).result
  console.log('[01] boxId:', boxId)

  await snapshot('before-pattern')

  // Create a work axis as the rotation center (Z axis through origin)
  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result
  console.log('[01] waZ:', waZ)

  // Circular pattern: 4 copies at 90° apart (0.785 rad ≈ 45°, let's try pi/2 = 1.5708)
  const cpId = (await api.v1.part.circularPattern({
    id: partId,
    name: 'CP1',
    targets: [boxId],
    references: [waZ],
    angle: 1.5708, // ~90 degrees
    count: 4,
  })).result
  console.log('[01] cpId:', cpId, 'maxLevel:', (await api.v1.common.recalc({})).maxLevel)

  await snapshot('after-pattern')

  return { partId, boxId, waZ, cpId }
}
