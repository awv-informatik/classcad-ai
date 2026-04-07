// Basic interpolation curve with 3 points (matching docs example)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Interp' })).result

  const r = await api.v1.curve.interpolationCurve({
    id: shapeId,
    points: [
      [0, 0, 0],
      [5, 15, 0],
      [10, 0, 0],
    ],
  })

  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '01-response')

  await snapshot('3points')
  return { partId }
}
