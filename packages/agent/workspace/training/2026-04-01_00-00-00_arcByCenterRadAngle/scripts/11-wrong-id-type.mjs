// 11 — Wrong ID types: pass part ID, EI ID instead of shape ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongIdTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  const results = {}

  // Pass part ID instead of shape ID
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: partId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI, radius: 10,
  })
  results.partId = { maxLevel: r1.maxLevel, msgs: r1.messages }
  console.log('[11] partId:', r1.maxLevel, JSON.stringify(r1.messages))

  // Pass EI ID
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: eifId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI, radius: 10,
  })
  results.eifId = { maxLevel: r2.maxLevel, msgs: r2.messages }
  console.log('[11] eifId:', r2.maxLevel, JSON.stringify(r2.messages))

  filewrite(results, 'wrong-id')
  return { partId }
}
