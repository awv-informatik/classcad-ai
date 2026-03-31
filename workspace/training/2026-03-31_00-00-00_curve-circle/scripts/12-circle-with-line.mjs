export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Mixed' })).result

  // Mix lines and circles in the same shape
  await api.v1.curve.line({ id: shapeId, startPos: [-30, 0, 0], endPos: [30, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, -30, 0], endPos: [0, 30, 0] })
  await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 25 })

  // Smaller circle off-center
  await api.v1.curve.circle({ id: shapeId, centerPos: [15, 10, 0], radius: 8 })

  await snapshot('circle-with-lines')
  return { partId, shapeId }
}
