// 03b — Small negative startAngle: -0.1 to PI
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SmallNegTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'SmallNeg' })).result

  console.log('[03b] testing small negative start angle: -0.1 to PI...')
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: -0.1, endAngle: Math.PI, radius: 10,
  })
  console.log('[03b] result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ maxLevel: r1.maxLevel, msgs: r1.messages }, 'small-neg-response')
  await snapshot('small-neg')
  return { partId }
}
