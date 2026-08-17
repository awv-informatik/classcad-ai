// Various angle ranges: quarter, half, three-quarter, near-full, full
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  const PI = Math.PI

  // Quarter arc (90°)
  const r1 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [-60, 30, 0],
    startAngle: 0, endAngle: PI / 2, radius1: 20, radius2: 10,
  })
  console.log('[02] quarter:', r1.result, 'maxLevel:', r1.maxLevel)

  // Half arc (180°)
  const r2 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [0, 30, 0],
    startAngle: 0, endAngle: PI, radius1: 20, radius2: 10,
  })
  console.log('[02] half:', r2.result, 'maxLevel:', r2.maxLevel)

  // Three-quarter arc (270°)
  const r3 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [60, 30, 0],
    startAngle: 0, endAngle: 3 * PI / 2, radius1: 20, radius2: 10,
  })
  console.log('[02] three-quarter:', r3.result, 'maxLevel:', r3.maxLevel)

  // Near-full arc (350°)
  const r4 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [-60, -30, 0],
    startAngle: 0, endAngle: 2 * PI * 350 / 360, radius1: 20, radius2: 10,
  })
  console.log('[02] near-full:', r4.result, 'maxLevel:', r4.maxLevel)

  // Full circle (0 to 2*PI) — should this be same as ellipse?
  const r5 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [0, -30, 0],
    startAngle: 0, endAngle: 2 * PI, radius1: 20, radius2: 10,
  })
  console.log('[02] full:', r5.result, 'maxLevel:', r5.maxLevel)

  await snapshot('angle-ranges')
  return { partId }
}
