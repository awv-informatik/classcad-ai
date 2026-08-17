// Polyline with bulge values — arcs on some segments
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BulgeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'BulgeShape' })).result

  // Square with alternating bulges (from docs example)
  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],
      [30, 0, 0],
      [30, 30, 0],
      [0, 30, 0],
      [0, 0, 0],
    ],
    bulges: [0.3, -0.3, 0.3, -0.3, 0],
  })

  console.log('[03] bulge polyline result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'bulge-response')

  await snapshot('bulge-arcs')
  return { partId }
}
