export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP07' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF07' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape07' }] })).result

  const points = [
    [0, 0, 0],
    [60, 0, 0],
    [70, 40, 0],
    [20, 70, 0],
    [-10, 30, 0],
  ]

  const bulges = [0.2, -0.2, 0.2, -0.2]

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points,
        bulges,
        close: true,
      },
    ],
  })

  await snapshot('07-close-bulges-points-minus-1')

  return { partId, eifId, shapeId, pointsCount: points.length, bulgesCount: bulges.length, poly }
}
