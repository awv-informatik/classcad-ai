// Edge case: all control points identical
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DupPts' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Dups' })).result

  const r = await api.v1.curve.bezierCurve({
    id: shapeId,
    points: [[10, 10, 0], [10, 10, 0], [10, 10, 0], [10, 10, 0]],
  })

  console.log('[08] duplicate points: result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'dup-pts-response')
  return { partId }
}
