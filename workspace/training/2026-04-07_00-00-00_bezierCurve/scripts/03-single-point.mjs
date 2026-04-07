// Edge case: 1 control point only — minimum viable?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SinglePt' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'One' })).result

  const r = await api.v1.curve.bezierCurve({
    id: shapeId,
    points: [[10, 10, 0]],
  })

  console.log('[03] single point: result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'single-pt-response')
  return { partId }
}
