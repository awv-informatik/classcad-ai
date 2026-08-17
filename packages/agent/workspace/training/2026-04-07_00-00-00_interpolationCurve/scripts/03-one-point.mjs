// Edge case: single point — expect error
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Interp1pt' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  const r = await api.v1.curve.interpolationCurve({
    id: shapeId,
    points: [[5, 5, 0]],
  })

  console.log('[03] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '03-response')

  return { partId }
}
