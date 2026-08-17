// 14 — High start angles: verify arcs starting at angles > PI work correctly
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'HighStart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: PI to 3*PI/2 (third quadrant)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Q3' })).result
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: Math.PI, endAngle: 3 * Math.PI / 2, radius: 10,
  })
  console.log('[14] PI to 3PI/2:', r1.result, 'maxLevel:', r1.maxLevel)

  // Shape 2: 3*PI/2 to 2*PI (fourth quadrant)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Q4' })).result
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [25, 0, 0], startAngle: 3 * Math.PI / 2, endAngle: 2 * Math.PI, radius: 10,
  })
  console.log('[14] 3PI/2 to 2PI:', r2.result, 'maxLevel:', r2.maxLevel)

  // Shape 3: PI/4 to 7*PI/4 (315° arc)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'Wide' })).result
  const r3 = await api.v1.curve.arcByCenterRadAngle({
    id: s3, centerPos: [50, 0, 0], startAngle: Math.PI / 4, endAngle: 7 * Math.PI / 4, radius: 10,
  })
  console.log('[14] PI/4 to 7PI/4 (315°):', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    q3: { maxLevel: r1.maxLevel, msgs: r1.messages },
    q4: { maxLevel: r2.maxLevel, msgs: r2.messages },
    wide: { maxLevel: r3.maxLevel, msgs: r3.messages },
  }, 'responses')

  await snapshot('high-start')
  return { partId }
}
