export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: '3DCircles' })).result

  // Circle in XY plane (default)
  await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20, normal: [0, 0, 1] })

  // Circle in YZ plane
  await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20, normal: [1, 0, 0] })

  // Circle in XZ plane
  await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20, normal: [0, 1, 0] })

  await snapshot('3d-circles')

  // 3D center position with tilted normal
  const partId2 = (await api.v1.part.create({ name: 'Tilted' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2 })).result
  const shapeId2 = (await api.v1.curve.shape({ id: eifId2, name: 'TiltedCircle' })).result

  await api.v1.curve.circle({ id: shapeId2, centerPos: [10, 20, 30], radius: 15, normal: [1, 1, 0] })
  await snapshot('tilted-circle')

  return { partId }
}
