export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP08' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF08' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape08' }] })).result

  const points = [
    [0, 0, 0],
    [50, 0, 0],
    [50, 50, 0],
    [0, 50, 0],
    [0, 0, 0],
  ]

  const bulges = [0, 0, 0, 0, 0]

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

  await snapshot('08-close-true-repeat-endpoint')

  return { partId, eifId, shapeId, pointsCount: points.length, bulgesCount: bulges.length, poly }
}
