// Edge case: empty points array
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyPts' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Empty' })).result

  const r = await api.v1.curve.bezierCurve({
    id: shapeId,
    points: [],
  })

  console.log('[04] empty points: result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-pts-response')
  return { partId }
}
