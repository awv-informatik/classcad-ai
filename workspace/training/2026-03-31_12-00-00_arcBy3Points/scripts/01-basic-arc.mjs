// 01 - Basic arcBy3Points: simple arc in XY plane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

  // Simple arc: start at left, mid at top, end at right
  const r = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [0, 0, 0],
    midPos: [25, 25, 0],
    endPos: [50, 0, 0],
  })

  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'arc-response')

  await snapshot('basic-arc')
  return { partId }
}
