export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Lines' })).result
  console.log('[01] partId:', partId, 'eifId:', eifId, 'shapeId:', shapeId)

  // Basic line
  const r = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  console.log('[01] line result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'line-response')

  await snapshot('basic-line')
  return { partId, shapeId }
}
