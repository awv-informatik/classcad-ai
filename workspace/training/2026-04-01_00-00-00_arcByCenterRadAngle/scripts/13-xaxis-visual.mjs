// 13 — xAxis visual comparison: same 90° arc at different xAxis directions, different radii for visual distinction
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'XAxisVisual' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

  // Arc 1: default xAxis [1,0,0], radius 20 — should start at +X
  await api.v1.curve.arcByCenterRadAngle({
    id: shapeId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 20,
  })

  // Arc 2: xAxis [0,1,0], radius 15 — should start at +Y
  await api.v1.curve.arcByCenterRadAngle({
    id: shapeId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 15,
    xAxis: [0, 1, 0],
  })

  // Arc 3: xAxis [-1,0,0], radius 10 — should start at -X
  await api.v1.curve.arcByCenterRadAngle({
    id: shapeId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10,
    xAxis: [-1, 0, 0],
  })

  // Also add reference lines to show axis directions
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [25, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [0, 25, 0] })

  console.log('[13] Three arcs at same center, different xAxis, different radii')
  await snapshot('xaxis-visual')
  return { partId }
}
