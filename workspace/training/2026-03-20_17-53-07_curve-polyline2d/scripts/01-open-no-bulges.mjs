export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP01' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF01' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape01' }] })).result

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points: [
          [0, 0, 0],
          [50, 0, 0],
          [70, 30, 0],
          [20, 60, 0],
        ],
      },
    ],
  })

  await snapshot('01-open-no-bulges')

  return { partId, eifId, shapeId, poly }
}
