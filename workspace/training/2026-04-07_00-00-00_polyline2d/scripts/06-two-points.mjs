// Edge case: minimum 2 points (single segment)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TwoPoints' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'TwoPt' })).result

  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],
      [50, 30, 0],
    ],
  })

  console.log('[06] 2-point result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'two-point-response')

  await snapshot('two-points')
  return { partId }
}
