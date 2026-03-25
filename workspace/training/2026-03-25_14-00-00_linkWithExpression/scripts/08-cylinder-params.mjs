// Link expression to cylinder params (diameter, height)
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'D', value: 80 },
      { name: 'CH', value: 100 },
    ],
  })

  // Reference box
  await api.v1.part.box({ id: partId, length: 40, width: 40, height: 40, position: [80, 0, 0] })

  const cylId = (await api.v1.part.cylinder({
    id: partId, diameter: 30, height: 50,
  })).result

  await snapshot('before')

  await api.v1.part.linkWithExpression({ id: cylId, exprName: 'D', name: 'diameter' })
  await api.v1.part.linkWithExpression({ id: cylId, exprName: 'CH', name: 'height' })
  await api.v1.common.recalc()
  await snapshot('after')

  return { partId, cylId }
}
