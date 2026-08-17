// 04 - Edge case: collinear points (all three on a line)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CollinearArc' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

  // Collinear: all three points on X axis
  const r = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [0, 0, 0],
    midPos: [25, 0, 0],
    endPos: [50, 0, 0],
  })

  console.log('[04] collinear result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'collinear-response')

  await snapshot('collinear')
  return { partId }
}
