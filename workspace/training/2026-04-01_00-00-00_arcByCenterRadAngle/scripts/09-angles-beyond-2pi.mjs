// 09 — Angles beyond 2*PI: do they wrap, create multi-turn arcs, or error?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BeyondAngles' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Case 1: 0 to 4*PI (two full rotations)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'TwoRotations' })).result
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: 0, endAngle: 4 * Math.PI, radius: 10,
  })
  console.log('[09] 0 to 4PI:', r1.result, 'maxLevel:', r1.maxLevel)

  // Case 2: PI to 3*PI (one full rotation starting from PI)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'PiTo3Pi' })).result
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [30, 0, 0], startAngle: Math.PI, endAngle: 3 * Math.PI, radius: 10,
  })
  console.log('[09] PI to 3PI:', r2.result, 'maxLevel:', r2.maxLevel)

  // Case 3: 0 to 10*PI
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'FiveRotations' })).result
  const r3 = await api.v1.curve.arcByCenterRadAngle({
    id: s3, centerPos: [60, 0, 0], startAngle: 0, endAngle: 10 * Math.PI, radius: 10,
  })
  console.log('[09] 0 to 10PI:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    twoRot: { maxLevel: r1.maxLevel, msgs: r1.messages },
    piTo3pi: { maxLevel: r2.maxLevel, msgs: r2.messages },
    fiveRot: { maxLevel: r3.maxLevel, msgs: r3.messages },
  }, 'responses')

  await snapshot('beyond-2pi')
  return { partId }
}
