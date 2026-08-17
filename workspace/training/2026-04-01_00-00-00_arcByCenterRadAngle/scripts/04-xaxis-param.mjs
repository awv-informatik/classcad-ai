// 04 — xAxis parameter: custom reference direction for angle measurement
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'XAxisTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: default xAxis [1,0,0] — 90° arc from +X toward +Y
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'DefaultXAxis' })).result
  await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 15,
  })

  // Shape 2: xAxis = [0,1,0] — 90° arc should start from +Y direction
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'XAxisY' })).result
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 12,
    xAxis: [0, 1, 0],
  })
  console.log('[04] xAxis=[0,1,0]:', r2.result, 'maxLevel:', r2.maxLevel)

  // Shape 3: xAxis = [1,1,0] (diagonal) — 90° arc from 45° direction
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'XAxisDiag' })).result
  const r3 = await api.v1.curve.arcByCenterRadAngle({
    id: s3, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 9,
    xAxis: [1, 1, 0],
  })
  console.log('[04] xAxis=[1,1,0]:', r3.result, 'maxLevel:', r3.maxLevel)

  // Shape 4: xAxis = [-1,0,0] — 90° arc from -X direction
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'XAxisNegX' })).result
  const r4 = await api.v1.curve.arcByCenterRadAngle({
    id: s4, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 6,
    xAxis: [-1, 0, 0],
  })
  console.log('[04] xAxis=[-1,0,0]:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    xAxisY: { maxLevel: r2.maxLevel, msgs: r2.messages },
    xAxisDiag: { maxLevel: r3.maxLevel, msgs: r3.messages },
    xAxisNegX: { maxLevel: r4.maxLevel, msgs: r4.messages },
  }, 'responses')

  await snapshot('xaxis-variants')
  return { partId }
}
