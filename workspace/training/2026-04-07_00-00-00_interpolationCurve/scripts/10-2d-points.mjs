// 2D points [x, y] — expect error (need 3-element arrays)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Interp2D' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  const r = await api.v1.curve.interpolationCurve({
    id: shapeId,
    points: [[0, 0], [10, 10], [20, 0]],
  })

  console.log('[10] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '10-response')

  return { partId }
}
