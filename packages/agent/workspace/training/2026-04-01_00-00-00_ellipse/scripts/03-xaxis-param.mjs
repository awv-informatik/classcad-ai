// Test xAxis parameter — does it orient the major axis?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'XAxisTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Default xAxis [1,0,0] — major axis along X
  const r1 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [-40, 0, 0], radius1: 30, radius2: 10 })
  console.log('[03] default xAxis: maxLevel:', r1.maxLevel)

  // xAxis [0,1,0] — major axis along Y
  const r2 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [40, 0, 0], radius1: 30, radius2: 10, xAxis: [0, 1, 0] })
  console.log('[03] xAxis=[0,1,0]: maxLevel:', r2.maxLevel)

  // xAxis [1,1,0] — major axis along 45 degrees
  const r3 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 50, 0], radius1: 30, radius2: 10, xAxis: [1, 1, 0] })
  console.log('[03] xAxis=[1,1,0]: maxLevel:', r3.maxLevel)

  await snapshot('xaxis-variants')
  return { partId }
}
