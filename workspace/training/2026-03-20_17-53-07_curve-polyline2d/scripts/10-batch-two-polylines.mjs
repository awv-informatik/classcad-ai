export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP10' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF10' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape10' }] })).result

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points: [
          [0, 0, 0],
          [40, 0, 0],
          [40, 30, 0],
          [0, 30, 0],
        ],
      },
      {
        id: shapeId,
        points: [
          [60, 10, 0],
          [90, 10, 0],
          [90, 40, 0],
          [60, 40, 0],
        ],
        close: true,
        bulges: [0, 0, 0, 0],
      },
    ],
  })

  await snapshot('10-batch-two-polylines')

  return { partId, eifId, shapeId, poly }
}
