export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Mixed' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Mix' })).result

  // Mix lines and circle in same shape
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [60, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [60, 0, 0], endPos: [60, 40, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [60, 40, 0], endPos: [0, 40, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, 40, 0], endPos: [0, 0, 0] })
  await api.v1.curve.circle({ id: shapeId, centerPos: [30, 20, 0], radius: 10 })

  await snapshot('rect-with-circle')
  return { partId, shapeId }
}
