// Multiple arcs in separate shapes for visual verification
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Quarter arc (90°) in its own shape
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Quarter' })).result
  await api.v1.curve.ellipticArc({
    id: s1, centerPos: [-60, 30, 0],
    startAngle: 0, endAngle: Math.PI / 2, radius1: 20, radius2: 10,
  })

  // Half arc (180°) in its own shape
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Half' })).result
  await api.v1.curve.ellipticArc({
    id: s2, centerPos: [0, 30, 0],
    startAngle: 0, endAngle: Math.PI, radius1: 20, radius2: 10,
  })

  // Three-quarter arc (270°) in its own shape
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'ThreeQ' })).result
  await api.v1.curve.ellipticArc({
    id: s3, centerPos: [60, 30, 0],
    startAngle: 0, endAngle: 3 * Math.PI / 2, radius1: 20, radius2: 10,
  })

  // Full ellipse via ellipticArc (0→2PI)
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'Full' })).result
  await api.v1.curve.ellipticArc({
    id: s4, centerPos: [-60, -30, 0],
    startAngle: 0, endAngle: 2 * Math.PI, radius1: 20, radius2: 10,
  })

  // Complement arc: start > end (PI/2 → 0 = 270° arc)
  const s5 = (await api.v1.curve.shape({ id: eifId, name: 'Complement' })).result
  await api.v1.curve.ellipticArc({
    id: s5, centerPos: [0, -30, 0],
    startAngle: Math.PI / 2, endAngle: 0, radius1: 20, radius2: 10,
  })

  // Non-zero start: PI/4 → 3*PI/4
  const s6 = (await api.v1.curve.shape({ id: eifId, name: 'MidRange' })).result
  await api.v1.curve.ellipticArc({
    id: s6, centerPos: [60, -30, 0],
    startAngle: Math.PI / 4, endAngle: 3 * Math.PI / 4, radius1: 20, radius2: 10,
  })

  await snapshot('separate-shapes')
  return { partId }
}
