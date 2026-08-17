// 05 — normal parameter: arc plane orientation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NormalTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: default normal [0,0,1] — arc in XY plane
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'NormalZ' })).result
  await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 15,
  })

  // Shape 2: normal [0,1,0] — arc in XZ plane
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'NormalY' })).result
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [30, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 15,
    normal: [0, 1, 0],
  })
  console.log('[05] normal=[0,1,0]:', r2.result, 'maxLevel:', r2.maxLevel)

  // Shape 3: normal [1,0,0] — arc in YZ plane
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'NormalX' })).result
  const r3 = await api.v1.curve.arcByCenterRadAngle({
    id: s3, centerPos: [0, 30, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 15,
    normal: [1, 0, 0],
  })
  console.log('[05] normal=[1,0,0]:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    normalY: { maxLevel: r2.maxLevel, msgs: r2.messages },
    normalX: { maxLevel: r3.maxLevel, msgs: r3.messages },
  }, 'responses')

  await snapshot('normal-variants')
  return { partId }
}
