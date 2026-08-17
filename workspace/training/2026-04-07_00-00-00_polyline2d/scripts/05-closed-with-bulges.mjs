// Closed polyline with bulges — rounded rectangle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ClosedBulge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'RoundRect' })).result

  // tan(pi/8) ≈ 0.41421 → 90° arc
  const bulge90 = Math.tan(Math.PI / 8)
  console.log('[05] bulge for 90° arc:', bulge90)

  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],
      [40, 0, 0],
      [40, 25, 0],
      [0, 25, 0],
    ],
    bulges: [0, bulge90, 0, bulge90],
    close: true,
  })

  console.log('[05] closed+bulges result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'closed-bulge-response')

  await snapshot('closed-bulges')
  return { partId }
}
