// 16 — Dump edge data to understand arc geometry: forward vs reversed vs different xAxis
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeData' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Arc 1: forward 0 to PI/2
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Forward' })).result
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10,
  })
  filewrite(r1.graphic, 'forward-graphic')
  filewrite(r1.structure, 'forward-structure')

  // Arc 2: reversed PI/2 to 0
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Reversed' })).result
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [30, 0, 0], startAngle: Math.PI / 2, endAngle: 0, radius: 10,
  })
  filewrite(r2.graphic, 'reversed-graphic')

  // Arc 3: 0 to PI/2 with xAxis=[0,1,0]
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'XAxisY' })).result
  const r3 = await api.v1.curve.arcByCenterRadAngle({
    id: s3, centerPos: [60, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10,
    xAxis: [0, 1, 0],
  })
  filewrite(r3.graphic, 'xaxis-y-graphic')

  console.log('[16] Forward maxLevel:', r1.maxLevel, 'Reversed maxLevel:', r2.maxLevel, 'xAxisY maxLevel:', r3.maxLevel)
  return { partId }
}
