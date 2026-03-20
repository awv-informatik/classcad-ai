export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP04' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF04' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape04' }] })).result

  const points = [
    [0, 0, 0],
    [40, 0, 0],
    [60, 20, 0],
    [60, 60, 0],
    [20, 60, 0],
  ]

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points,
        bulges: [0.5, -0.5],
      },
    ],
  })

  await snapshot('04-bulges-too-short')

  return { partId, eifId, shapeId, pointsCount: points.length, bulgesCount: 2, poly }
}
