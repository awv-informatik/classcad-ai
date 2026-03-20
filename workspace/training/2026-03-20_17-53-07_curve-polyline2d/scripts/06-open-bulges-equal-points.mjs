export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP06' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF06' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape06' }] })).result

  const points = [
    [0, 0, 0],
    [40, 0, 0],
    [70, 20, 0],
    [60, 60, 0],
    [20, 70, 0],
  ]

  const bulges = [0.3, -0.4, 0, 0.25, 0]

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points,
        bulges,
      },
    ],
  })

  await snapshot('06-open-bulges-equal-points')

  return { partId, eifId, shapeId, pointsCount: points.length, bulgesCount: bulges.length, poly }
}
