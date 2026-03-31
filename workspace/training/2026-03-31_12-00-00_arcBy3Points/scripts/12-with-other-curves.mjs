// 12 - Realistic usage: arc combined with lines to form a closed profile
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcProfile' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result

  // Draw a D-shape: straight left side, arc right side
  // Bottom-left to top-left (vertical line)
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [0, 40, 0] })

  // Top-left to top-right (horizontal line)
  await api.v1.curve.line({ id: shapeId, startPos: [0, 40, 0], endPos: [30, 40, 0] })

  // Top-right to bottom-right via arc (bulging right)
  await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [30, 40, 0],
    midPos: [50, 20, 0],
    endPos: [30, 0, 0],
  })

  // Bottom-right to bottom-left (horizontal line)
  await api.v1.curve.line({ id: shapeId, startPos: [30, 0, 0], endPos: [0, 0, 0] })

  await snapshot('d-profile')
  return { partId }
}
