export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP12' }] })).result

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: partId,
        points: [
          [0, 0, 0],
          [40, 0, 0],
          [60, 20, 0],
          [0, 50, 0],
        ],
      },
    ],
  })

  await snapshot('12-wrong-id-partid')

  return { partId, poly }
}
