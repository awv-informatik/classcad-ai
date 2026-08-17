// 03c — Reversed angles (startAngle > endAngle, both positive): PI/2 to 0
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ReversedTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Reversed' })).result

  console.log('[03c] testing reversed: PI/2 to 0...')
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: Math.PI / 2, endAngle: 0, radius: 10,
  })
  console.log('[03c] result:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))
  filewrite({ maxLevel: r1.maxLevel, msgs: r1.messages }, 'reversed-response')
  await snapshot('reversed')
  return { partId }
}
