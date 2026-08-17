// xAxis parameter — rotates the reference direction for angle 0
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Default xAxis [1,0,0] — angle 0 points in +X
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'DefaultX' })).result
  await api.v1.curve.ellipticArc({
    id: s1, centerPos: [-40, 0, 0],
    startAngle: 0, endAngle: Math.PI / 2, radius1: 25, radius2: 12,
  })

  // xAxis [0,1,0] — angle 0 points in +Y
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'XAxisY' })).result
  await api.v1.curve.ellipticArc({
    id: s2, centerPos: [40, 0, 0],
    startAngle: 0, endAngle: Math.PI / 2, radius1: 25, radius2: 12,
    xAxis: [0, 1, 0],
  })

  // xAxis [1,1,0] (diagonal) — should be normalized internally
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'XAxisDiag' })).result
  await api.v1.curve.ellipticArc({
    id: s3, centerPos: [0, -40, 0],
    startAngle: 0, endAngle: Math.PI / 2, radius1: 25, radius2: 12,
    xAxis: [1, 1, 0],
  })

  await snapshot('xaxis')
  return { partId }
}
