// Test error cases: missing params, wrong ID type
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Missing radius1
  const r1 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 0, 0], radius2: 10 })
  console.log('[08] missing r1: maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'missing-r1')

  // Missing radius2
  const r2 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 0, 0], radius1: 10 })
  console.log('[08] missing r2: maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'missing-r2')

  // Missing centerPos
  const r3 = await api.v1.curve.ellipse({ id: shapeId, radius1: 10, radius2: 5 })
  console.log('[08] missing centerPos: maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'missing-center')

  // Wrong ID type (part ID instead of shape ID)
  const r4 = await api.v1.curve.ellipse({ id: partId, centerPos: [0, 0, 0], radius1: 10, radius2: 5 })
  console.log('[08] wrong id type: maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'wrong-id')

  // 2D point (only 2 elements)
  const r5 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 0], radius1: 10, radius2: 5 })
  console.log('[08] 2D point: maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, '2d-point')

  return { partId }
}
