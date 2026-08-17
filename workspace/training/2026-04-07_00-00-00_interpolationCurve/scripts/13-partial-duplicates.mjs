// Partially duplicate — some points same, some different
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpPartDup' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Two consecutive points are the same — creates a cusp?
  const r = await api.v1.curve.interpolationCurve({
    id: shapeId,
    points: [
      [0, 0, 0],
      [10, 20, 0],
      [10, 20, 0],  // duplicate of previous
      [20, 0, 0],
    ],
  })

  console.log('[13] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '13-response')

  await snapshot('partial-dup')
  return { partId }
}
