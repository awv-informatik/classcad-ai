// normal parameter — arc in a different plane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Default normal [0,0,1] — XY plane
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'XYPlane' })).result
  const r1 = await api.v1.curve.ellipticArc({
    id: s1, centerPos: [0, 0, 0],
    startAngle: 0, endAngle: Math.PI, radius1: 25, radius2: 12,
  })
  console.log('[12] XY plane:', r1.result, 'maxLevel:', r1.maxLevel)

  // normal [1,0,0] — YZ plane
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'YZPlane' })).result
  const r2 = await api.v1.curve.ellipticArc({
    id: s2, centerPos: [0, 30, 0],
    startAngle: 0, endAngle: Math.PI, radius1: 25, radius2: 12,
    normal: [1, 0, 0],
    xAxis: [0, 1, 0],
  })
  console.log('[12] YZ plane:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('normal')
  return { partId }
}
