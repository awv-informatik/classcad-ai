// 12 — Realistic usage: Create a closed profile using lines + arcByCenter (e.g., rounded rectangle)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result

  // Rounded rectangle: 80 x 40 with r=10 corners
  const w = 80, h = 40, r = 10

  // Bottom edge
  await api.v1.curve.line({ id: shapeId, startPos: [r, 0, 0], endPos: [w - r, 0, 0] })
  // Bottom-right corner arc
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [w - r, r, 0], startPos: [w - r, 0, 0], endPos: [w, r, 0], isClockwise: false,
  })
  // Right edge
  await api.v1.curve.line({ id: shapeId, startPos: [w, r, 0], endPos: [w, h - r, 0] })
  // Top-right corner arc
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [w - r, h - r, 0], startPos: [w, h - r, 0], endPos: [w - r, h, 0], isClockwise: false,
  })
  // Top edge
  await api.v1.curve.line({ id: shapeId, startPos: [w - r, h, 0], endPos: [r, h, 0] })
  // Top-left corner arc
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [r, h - r, 0], startPos: [r, h, 0], endPos: [0, h - r, 0], isClockwise: false,
  })
  // Left edge
  await api.v1.curve.line({ id: shapeId, startPos: [0, h - r, 0], endPos: [0, r, 0] })
  // Bottom-left corner arc
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [r, r, 0], startPos: [0, r, 0], endPos: [r, 0, 0], isClockwise: false,
  })

  await snapshot('rounded-rect')
  return { partId, shapeId }
}
