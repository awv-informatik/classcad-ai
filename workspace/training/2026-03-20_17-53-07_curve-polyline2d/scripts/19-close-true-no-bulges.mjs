export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP19' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF19' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape19' }] })).result

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points: [
          [0, 0, 0],
          [55, 0, 0],
          [55, 35, 0],
          [0, 35, 0],
        ],
        close: true,
      },
    ],
  })

  await snapshot('19-close-true-no-bulges')

  return { partId, eifId, shapeId, poly }
}
