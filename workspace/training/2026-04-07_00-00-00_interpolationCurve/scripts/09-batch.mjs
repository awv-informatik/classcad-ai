// Batch creation — array of params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpBatch' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  const r = await api.v1.curve.interpolationCurve([
    {
      id: shapeId,
      points: [[0, 0, 0], [5, 15, 0], [10, 0, 0]],
    },
    {
      id: shapeId,
      points: [[20, 0, 0], [25, 15, 0], [30, 0, 0]],
    },
  ])

  console.log('[09] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '09-response')

  await snapshot('batch-2curves')
  return { partId }
}
