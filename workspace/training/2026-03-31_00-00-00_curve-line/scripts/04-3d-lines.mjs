export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: '3DLines' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: '3D' })).result

  // 3D lines with non-zero Z
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [30, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [0, 30, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [0, 0, 30] })
  // Diagonal 3D line
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [30, 30, 30] })

  await snapshot('3d-lines')
  return { partId, shapeId }
}
