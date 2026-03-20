export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP02' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF02' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape02' }] })).result

  const points = [
    [0, 0, 0],
    [40, 0, 0],
    [70, 30, 0],
    [40, 70, 0],
    [0, 70, 0],
  ]

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points,
        bulges: [0.5, -0.4, 0.3, 0],
      },
    ],
  })

  await snapshot('02-open-bulges-points-minus-1')

  return { partId, eifId, shapeId, pointsCount: points.length, bulgesCount: 4, poly }
}
