export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP18' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF18' }] })).result

  const shapeA = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'ShapeA' }] })).result
  const shapeB = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'ShapeB' }] })).result

  await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeA,
        points: [
          [0, 0, 0],
          [45, 0, 0],
          [45, 35, 0],
          [0, 35, 0],
        ],
        bulges: [0, 0, 0, 0],
        close: true,
      },
    ],
  })

  await execute({
    'v1.curve.polyline2d': [
      {
        id: shapeB,
        points: [
          [70, 0, 0],
          [110, 0, 0],
          [120, 30, 0],
          [85, 55, 0],
          [65, 25, 0],
        ],
        bulges: [0.4, -0.3, 0.2, -0.2, 0],
        close: true,
      },
    ],
  })

  await snapshot('18-before-clean-shapeA')

  await execute({ 'v1.curve.cleanShape': [{ ids: [shapeA] }] })

  await snapshot('18-after-clean-shapeA')

  return { partId, eifId, shapeA, shapeB }
}
