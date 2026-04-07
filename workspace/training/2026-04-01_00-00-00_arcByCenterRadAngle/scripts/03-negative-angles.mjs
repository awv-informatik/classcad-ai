// 03 — Negative angles and reversed angles (endAngle < startAngle)
// NOTE: startAngle == endAngle is tested separately in 03b (suspected hang)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegAngles' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: negative startAngle (-PI/2 to PI/2) — should be a semicircle on the right
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'NegStart' })).result
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: -Math.PI / 2, endAngle: Math.PI / 2, radius: 10,
  })
  console.log('[03] negStart:', r1.result, 'maxLevel:', r1.maxLevel)

  // Shape 2: reversed angles (PI/2 to 0) — does it go clockwise? Or wrap around?
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Reversed' })).result
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [30, 0, 0], startAngle: Math.PI / 2, endAngle: 0, radius: 10,
  })
  console.log('[03] reversed:', r2.result, 'maxLevel:', r2.maxLevel)

  // Shape 3: both negative (-PI to -PI/2)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'BothNeg' })).result
  const r3 = await api.v1.curve.arcByCenterRadAngle({
    id: s3, centerPos: [60, 0, 0], startAngle: -Math.PI, endAngle: -Math.PI / 2, radius: 10,
  })
  console.log('[03] bothNeg:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    negStart: { maxLevel: r1.maxLevel, msgs: r1.messages },
    reversed: { maxLevel: r2.maxLevel, msgs: r2.messages },
    bothNeg: { maxLevel: r3.maxLevel, msgs: r3.messages },
  }, 'responses')

  await snapshot('negative-angles')
  return { partId }
}
