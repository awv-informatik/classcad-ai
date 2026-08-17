// Edge case: duplicate consecutive points
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DupPoints' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'DupPt' })).result

  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],
      [30, 0, 0],
      [30, 0, 0], // duplicate
      [30, 20, 0],
    ],
  })

  console.log('[11] duplicate points result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'dup-points-response')

  return { partId }
}
