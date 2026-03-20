export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP16' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF16' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape16' }] })).result

  const points = [
    [0, 0, 0],
    [40, 0, 0],
    [60, 30, 0],
    [20, 60, 0],
  ]

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points,
        bulges: [0, 0, 0, 0, 0],
      },
    ],
  })

  await snapshot('16-bulges-too-long')

  return { partId, eifId, shapeId, pointsCount: points.length, bulgesCount: 5, poly }
}
