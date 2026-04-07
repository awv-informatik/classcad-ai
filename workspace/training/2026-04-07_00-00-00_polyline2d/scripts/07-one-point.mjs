// Edge case: single point — should this fail?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OnePoint' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'OnePt' })).result

  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [[10, 10, 0]],
  })

  console.log('[07] 1-point result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'one-point-response')

  return { partId }
}
