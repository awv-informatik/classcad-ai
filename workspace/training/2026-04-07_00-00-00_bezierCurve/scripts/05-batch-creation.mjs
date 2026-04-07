// Batch creation — pass array of bezier objects
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchBez' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Batch' })).result

  const r = await api.v1.curve.bezierCurve([
    {
      id: shapeId,
      points: [[0, 0, 0], [10, 30, 0], [30, 30, 0], [40, 0, 0]],
    },
    {
      id: shapeId,
      points: [[50, 0, 0], [60, 20, 0], [70, -20, 0], [80, 0, 0]],
    },
    {
      id: shapeId,
      points: [[90, 0, 0], [95, 40, 0], [110, 0, 0]],
    },
  ])

  console.log('[05] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch-bezier')
  return { partId }
}
