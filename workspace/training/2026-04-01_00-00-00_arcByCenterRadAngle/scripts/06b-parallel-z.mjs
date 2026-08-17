// 06b — Isolate: xAxis=[0,0,1] and normal=[0,0,1] (both Z, parallel)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ParZTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'ParallelZ' })).result

  console.log('[06b] testing xAxis=[0,0,1], normal=[0,0,1]...')
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10,
    xAxis: [0, 0, 1], normal: [0, 0, 1],
  })
  console.log('[06b] result:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))
  filewrite({ maxLevel: r1.maxLevel, msgs: r1.messages }, 'parallel-z-response')
  return { partId }
}
