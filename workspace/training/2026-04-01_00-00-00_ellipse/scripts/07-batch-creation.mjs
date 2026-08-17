// Test batch creation — array of ellipse objects
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Batch of 3 ellipses
  const r = await api.v1.curve.ellipse([
    { id: shapeId, centerPos: [-40, 0, 0], radius1: 20, radius2: 10 },
    { id: shapeId, centerPos: [0, 0, 0], radius1: 15, radius2: 15 },
    { id: shapeId, centerPos: [40, 0, 0], radius1: 25, radius2: 8 },
  ])
  console.log('[07] batch: result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-result')

  await snapshot('batch-ellipses')
  return { partId }
}
