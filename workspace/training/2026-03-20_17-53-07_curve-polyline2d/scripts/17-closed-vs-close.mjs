export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP17' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF17' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape17' }] })).result

  // Likely ignored parameter: closed
  await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points: [
          [0, 0, 0],
          [40, 0, 0],
          [40, 40, 0],
          [0, 40, 0],
        ],
        bulges: [0, 0, 0, 0],
        closed: true,
      },
    ],
  })

  // Supported parameter: close
  await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points: [
          [70, 0, 0],
          [110, 0, 0],
          [110, 40, 0],
          [70, 40, 0],
        ],
        bulges: [0, 0, 0, 0],
        close: true,
      },
    ],
  })

  await snapshot('17-closed-vs-close')

  return { partId, eifId, shapeId }
}
