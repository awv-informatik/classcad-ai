// All identical/duplicate points — degenerate case
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpDup' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  const r = await api.v1.curve.interpolationCurve({
    id: shapeId,
    points: [
      [10, 10, 0],
      [10, 10, 0],
      [10, 10, 0],
    ],
  })

  console.log('[06] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '06-response')

  return { partId }
}
