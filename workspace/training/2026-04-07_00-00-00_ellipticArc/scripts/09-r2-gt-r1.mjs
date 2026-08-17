// radius2 > radius1 — does it swap? Or is radius1 always along xAxis?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // r1 > r2 (wide in X)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'R1gtR2' })).result
  await api.v1.curve.ellipticArc({
    id: s1, centerPos: [-40, 0, 0],
    startAngle: 0, endAngle: Math.PI, radius1: 30, radius2: 10,
  })

  // r2 > r1 (narrow in X, wide perpendicular)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'R2gtR1' })).result
  await api.v1.curve.ellipticArc({
    id: s2, centerPos: [40, 0, 0],
    startAngle: 0, endAngle: Math.PI, radius1: 10, radius2: 30,
  })

  await snapshot('r2-gt-r1')
  return { partId }
}
