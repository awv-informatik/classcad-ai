export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FullCircleTest' })).result

  // Small cylinder offset from center
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl1',
    height: 20, diameter: 10,
    xPosition: 40, yPosition: 0, zPosition: 0,
  })).result

  const waZ = (await api.v1.part.workAxis({
    id: partId, name: 'AxisZ',
    origin: [0, 0, 0], direction: [0, 0, 1],
  })).result

  // Full 360° circle with 8 instances
  // If angle is "between entities", then 360/8 = 45° = 0.7854 rad
  const r1 = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP_fullcircle',
    targets: [cylId],
    references: [waZ],
    angle: 0.7854, // 45 degrees = 360/8
    count: 8,
  })
  console.log('[05] full circle: result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('full-circle-8')

  return { partId }
}
