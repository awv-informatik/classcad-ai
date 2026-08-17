// 03d — Negative endAngle: 0 to -PI/2
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegEndTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'NegEnd' })).result

  console.log('[03d] testing negative endAngle: 0 to -PI/2...')
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: 0, endAngle: -Math.PI / 2, radius: 10,
  })
  console.log('[03d] result:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))
  filewrite({ maxLevel: r1.maxLevel, msgs: r1.messages }, 'neg-end-response')
  await snapshot('neg-end')
  return { partId }
}
