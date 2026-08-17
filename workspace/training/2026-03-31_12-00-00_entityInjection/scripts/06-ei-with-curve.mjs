// 06 — Use entity injection ID with curve.shape to create curve container
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CurveTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'CurveContainer' })).result
  console.log('[06] partId:', partId, 'eifId:', eifId)

  // Create a shape inside the entity injection
  const shapeR = await api.v1.curve.shape({ id: eifId, name: 'TestShape' })
  console.log('[06] shape result:', shapeR.result, 'maxLevel:', shapeR.maxLevel)
  filewrite({ result: shapeR.result, messages: shapeR.messages, maxLevel: shapeR.maxLevel }, 'shape-response')

  // Draw a line in the shape
  const lineR = await api.v1.curve.line({ id: shapeR.result, startPos: [0, 0, 0], endPos: [100, 50, 0] })
  console.log('[06] line result:', lineR.result, 'maxLevel:', lineR.maxLevel)

  await snapshot('curve-in-ei')
  return { partId, eifId, shapeId: shapeR.result }
}
