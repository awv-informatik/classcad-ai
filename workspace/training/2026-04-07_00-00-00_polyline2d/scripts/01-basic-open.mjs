// Basic open polyline — 4 points, no bulges, no close
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Polyline2dTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'OpenPoly' })).result

  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],
      [30, 0, 0],
      [30, 20, 0],
      [0, 20, 0],
    ],
  })

  console.log('[01] polyline2d result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'open-poly-response')

  await snapshot('open-poly')
  return { partId, eifId, shapeId }
}
