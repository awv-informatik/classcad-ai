// Closed polyline — same 4 points with close: true
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ClosedPoly' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'ClosedPoly' })).result

  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],
      [30, 0, 0],
      [30, 20, 0],
      [0, 20, 0],
    ],
    close: true,
  })

  console.log('[02] closed polyline result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'closed-poly-response')

  await snapshot('closed-poly')
  return { partId }
}
