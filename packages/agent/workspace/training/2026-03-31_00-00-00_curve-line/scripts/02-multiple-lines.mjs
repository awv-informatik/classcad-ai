export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiLine' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Lines' })).result

  // Multiple lines - building a triangle
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [60, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [60, 0, 0], endPos: [30, 50, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 50, 0], endPos: [0, 0, 0] })

  await snapshot('triangle')
  return { partId, shapeId }
}
