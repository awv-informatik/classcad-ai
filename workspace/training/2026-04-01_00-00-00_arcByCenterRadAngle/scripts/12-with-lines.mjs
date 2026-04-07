// 12 — Realistic usage: rounded rectangle using only non-negative angles
// NOTE: negative angles hang the server, so we use 3*PI/2 instead of -PI/2
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Realistic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'RoundedRect' })).result

  const w = 80, h = 50, r = 10

  // Bottom edge (left to right)
  await api.v1.curve.line({ id: shapeId, startPos: [r, 0, 0], endPos: [w - r, 0, 0] })
  // Bottom-right corner: from 3*PI/2 (=pointing down) to 2*PI (=pointing right)
  await api.v1.curve.arcByCenterRadAngle({
    id: shapeId, centerPos: [w - r, r, 0], startAngle: 3 * Math.PI / 2, endAngle: 2 * Math.PI, radius: r,
  })
  // Right edge (bottom to top)
  await api.v1.curve.line({ id: shapeId, startPos: [w, r, 0], endPos: [w, h - r, 0] })
  // Top-right corner: from 0 to PI/2
  await api.v1.curve.arcByCenterRadAngle({
    id: shapeId, centerPos: [w - r, h - r, 0], startAngle: 0, endAngle: Math.PI / 2, radius: r,
  })
  // Top edge (right to left)
  await api.v1.curve.line({ id: shapeId, startPos: [w - r, h, 0], endPos: [r, h, 0] })
  // Top-left corner: from PI/2 to PI
  await api.v1.curve.arcByCenterRadAngle({
    id: shapeId, centerPos: [r, h - r, 0], startAngle: Math.PI / 2, endAngle: Math.PI, radius: r,
  })
  // Left edge (top to bottom)
  await api.v1.curve.line({ id: shapeId, startPos: [0, h - r, 0], endPos: [0, r, 0] })
  // Bottom-left corner: from PI to 3*PI/2
  await api.v1.curve.arcByCenterRadAngle({
    id: shapeId, centerPos: [r, r, 0], startAngle: Math.PI, endAngle: 3 * Math.PI / 2, radius: r,
  })

  console.log('[12] Rounded rectangle built with arcByCenterRadAngle (all non-negative angles)')
  await snapshot('rounded-rect')
  return { partId }
}
