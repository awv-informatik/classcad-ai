// 02 — Various angle ranges: semicircle, 270°, full circle, small angle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AngleRanges' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: semicircle (0 to PI)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Semicircle' })).result
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI, radius: 10,
  })
  console.log('[02] semicircle:', r1.result, 'maxLevel:', r1.maxLevel)

  // Shape 2: 270° arc (0 to 3PI/2)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: '270deg' })).result
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [30, 0, 0], startAngle: 0, endAngle: 3 * Math.PI / 2, radius: 10,
  })
  console.log('[02] 270deg:', r2.result, 'maxLevel:', r2.maxLevel)

  // Shape 3: full circle (0 to 2*PI)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'FullCircle' })).result
  const r3 = await api.v1.curve.arcByCenterRadAngle({
    id: s3, centerPos: [60, 0, 0], startAngle: 0, endAngle: 2 * Math.PI, radius: 10,
  })
  console.log('[02] fullCircle:', r3.result, 'maxLevel:', r3.maxLevel)

  // Shape 4: small 10° arc
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'SmallArc' })).result
  const r4 = await api.v1.curve.arcByCenterRadAngle({
    id: s4, centerPos: [90, 0, 0], startAngle: 0, endAngle: Math.PI / 18, radius: 10,
  })
  console.log('[02] 10deg:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    semicircle: { maxLevel: r1.maxLevel, msgs: r1.messages },
    deg270: { maxLevel: r2.maxLevel, msgs: r2.messages },
    fullCircle: { maxLevel: r3.maxLevel, msgs: r3.messages },
    smallArc: { maxLevel: r4.maxLevel, msgs: r4.messages },
  }, 'responses')

  await snapshot('various-angles')
  return { partId }
}
