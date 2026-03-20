export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP05' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF05' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape05' }] })).result

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points: [
          [0, 0, 0],
          [50, 0, 0],
          [70, 30, 15],
          [0, 50, 0],
        ],
      },
    ],
  })

  await snapshot('05-non-coplanar-points')

  return { partId, eifId, shapeId, poly }
}
