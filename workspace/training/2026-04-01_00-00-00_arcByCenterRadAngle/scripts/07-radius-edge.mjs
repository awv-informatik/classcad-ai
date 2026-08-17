// 07 — Radius edge cases: very small, very large (skip negative/zero — tested in 07b)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RadiusEdge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Case 1: very small radius (0.001)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'TinyRadius' })).result
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI, radius: 0.001,
  })
  console.log('[07] tiny radius 0.001:', r1.result, 'maxLevel:', r1.maxLevel)

  // Case 2: very large radius (10000)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'HugeRadius' })).result
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 4, radius: 10000,
  })
  console.log('[07] huge radius 10000:', r2.result, 'maxLevel:', r2.maxLevel)

  // Case 3: radius = 1 (normal, small)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'Radius1' })).result
  const r3 = await api.v1.curve.arcByCenterRadAngle({
    id: s3, centerPos: [30, 0, 0], startAngle: 0, endAngle: Math.PI, radius: 1,
  })
  console.log('[07] radius 1:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    tiny: { maxLevel: r1.maxLevel, msgs: r1.messages },
    huge: { maxLevel: r2.maxLevel, msgs: r2.messages },
    one: { maxLevel: r3.maxLevel, msgs: r3.messages },
  }, 'responses')

  await snapshot('radius-edge')
  return { partId }
}
