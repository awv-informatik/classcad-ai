export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP15' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF15' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape15' }] })).result

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points: [
          [0, 0, 0],
          [40, 0, 0],
          [80, 0, 0],
        ],
        bulges: [1, 0, 0],
      },
      {
        id: shapeId,
        points: [
          [0, 80, 0],
          [40, 80, 0],
          [80, 80, 0],
        ],
        bulges: [-1, 0, 0],
      },
    ],
  })

  await snapshot('15-bulge-sign-positive-vs-negative')

  return { partId, eifId, shapeId, poly }
}
