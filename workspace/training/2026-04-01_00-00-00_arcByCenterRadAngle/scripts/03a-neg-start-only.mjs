// 03a — Test negative start angle only: -PI/2 to PI/2
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegStartOnly' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'NegStart' })).result

  console.log('[03a] testing negative start angle: -PI/2 to PI/2...')
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: -Math.PI / 2, endAngle: Math.PI / 2, radius: 10,
  })
  console.log('[03a] result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ maxLevel: r1.maxLevel, msgs: r1.messages }, 'neg-start-response')
  await snapshot('neg-start')
  return { partId }
}
