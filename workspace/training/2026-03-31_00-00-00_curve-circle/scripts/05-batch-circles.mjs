export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result
  console.log('[05] setup done, shapeId:', shapeId)

  // Try batch create — array syntax
  console.log('[05] attempting batch circle call...')
  try {
    const r = await api.v1.curve.circle([
      { id: shapeId, centerPos: [0, 0, 0], radius: 10 },
      { id: shapeId, centerPos: [30, 0, 0], radius: 15 },
    ])
    console.log('[05] batch result:', r.result, 'maxLevel:', r.maxLevel)
    console.log('[05] messages:', JSON.stringify(r.messages))
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')
  } catch (e) {
    console.log('[05] batch error:', e.message)
    filewrite({ error: e.message }, 'batch-error')
  }

  await snapshot('batch-circles')
  return { partId, shapeId }
}
