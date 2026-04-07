// Error case: missing points param entirely
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoPts' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'None' })).result

  const r = await api.v1.curve.bezierCurve({
    id: shapeId,
  })

  console.log('[11] no points param: result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-pts-response')
  return { partId }
}
