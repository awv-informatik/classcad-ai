// Missing points parameter
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpNoPoints' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  const r = await api.v1.curve.interpolationCurve({
    id: shapeId,
  })

  console.log('[11] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '11-response')

  return { partId }
}
