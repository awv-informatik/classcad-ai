// Bulge = 1 → semicircle, bulge = -1 → semicircle clockwise
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SemicircleTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'SemiShape' })).result

  // Two segments: bulge=1 (semicircle CCW), bulge=-1 (semicircle CW)
  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],
      [30, 0, 0],
      [60, 0, 0],
    ],
    bulges: [1, -1, 0],
  })

  console.log('[04] semicircle bulge result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'semicircle-response')

  await snapshot('semicircle-bulges')
  return { partId }
}
