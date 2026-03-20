export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'CP13' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF13' }] })).result

  const poly = await execute({
    'v1.curve.polyline2d': [
      {
        id: eifId,
        points: [
          [0, 0, 0],
          [40, 0, 0],
          [60, 20, 0],
          [0, 50, 0],
        ],
      },
    ],
  })

  await snapshot('13-wrong-id-eifid')

  return { partId, eifId, poly }
}
