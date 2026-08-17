// Equal radii (r1 == r2) — should produce circular arc
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Elliptic arc with r1 == r2
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'EqualRadii' })).result
  const r1 = await api.v1.curve.ellipticArc({
    id: s1, centerPos: [0, 0, 0],
    startAngle: 0, endAngle: Math.PI, radius1: 20, radius2: 20,
  })
  console.log('[06] equal radii:', r1.result, 'maxLevel:', r1.maxLevel)

  // For comparison: regular arc with same radius
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'CircularArc' })).result
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [50, 0, 0],
    startAngle: 0, endAngle: Math.PI, radius: 20,
  })
  console.log('[06] circular arc:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('equal-radii')
  return { partId }
}
