export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP03' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF03' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape03' }] })).result

  const points = [
    [0, 0, 0],
    [60, 0, 0],
    [60, 40, 0],
    [0, 40, 0],
  ]

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points,
        bulges: [0, 0, 0, 0],
        close: true,
      },
    ],
  })

  await snapshot('03-close-true-no-repeat')

  return { partId, eifId, shapeId, pointsCount: points.length, bulgesCount: 4, poly }
}
