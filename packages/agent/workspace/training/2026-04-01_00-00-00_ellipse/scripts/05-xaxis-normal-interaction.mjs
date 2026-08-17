// Test xAxis and normal interaction: same vector, orthogonal, parallel
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InteractionTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // xAxis == normal (docs say "should be different")
  const r1 = await api.v1.curve.ellipse({
    id: shapeId, centerPos: [0, 0, 0], radius1: 25, radius2: 10,
    xAxis: [0, 0, 1], normal: [0, 0, 1]
  })
  console.log('[05] xAxis==normal: result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'xaxis-eq-normal')

  // xAxis perpendicular to normal (ideal case)
  const r2 = await api.v1.curve.ellipse({
    id: shapeId, centerPos: [60, 0, 0], radius1: 25, radius2: 10,
    xAxis: [1, 0, 0], normal: [0, 0, 1]
  })
  console.log('[05] xAxis perp normal: maxLevel:', r2.maxLevel)

  // xAxis at 45 degrees to normal
  const r3 = await api.v1.curve.ellipse({
    id: shapeId, centerPos: [0, 60, 0], radius1: 25, radius2: 10,
    xAxis: [1, 0, 1], normal: [0, 0, 1]
  })
  console.log('[05] xAxis 45deg to normal: maxLevel:', r3.maxLevel)

  await snapshot('xaxis-normal-interaction')
  return { partId }
}
