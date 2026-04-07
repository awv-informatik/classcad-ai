// Realistic: L-shaped bracket profile with one rounded corner
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LBracket' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result

  // L-shaped profile with one rounded inner corner
  // bulge ≈ tan(π/8) = 0.41421 for 90° arc
  const b90 = Math.tan(Math.PI / 8)

  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],   // bottom-left
      [60, 0, 0],   // bottom-right
      [60, 20, 0],  // step right
      [20, 20, 0],  // inner corner (rounded)
      [20, 50, 0],  // top of vertical arm
      [0, 50, 0],   // top-left
    ],
    bulges: [0, 0, 0, b90, 0, 0],
    close: true,
  })

  console.log('[13] L-bracket result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'l-bracket-response')

  await snapshot('l-bracket-profile')
  return { partId }
}
