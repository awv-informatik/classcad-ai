export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP20' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF20' }] })).result
  const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Shape20' }] })).result

  // Open polyline, trailing bulge = 0
  await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points: [
          [0, 0, 0],
          [30, 0, 0],
          [60, 20, 0],
          [80, 50, 0],
        ],
        bulges: [0.4, -0.3, 0.2, 0],
      },
    ],
  })

  // Open polyline, trailing bulge = 1 (same first 3 bulges)
  await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeId,
        points: [
          [0, 80, 0],
          [30, 80, 0],
          [60, 100, 0],
          [80, 130, 0],
        ],
        bulges: [0.4, -0.3, 0.2, 1],
      },
    ],
  })

  await snapshot('20-open-trailing-bulge-effect')

  return { partId, eifId, shapeId }
}
