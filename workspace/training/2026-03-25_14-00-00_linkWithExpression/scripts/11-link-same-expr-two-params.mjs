// Link the same expression to two different params
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'S', value: 80 }] })
  await api.v1.part.cylinder({ id: partId, diameter: 20, height: 60, position: [120, 0, 0] })

  const boxId = (await api.v1.part.box({
    id: partId, length: 40, width: 30, height: 20,
  })).result

  await snapshot('before')

  // Link S to both length and height
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'S', name: 'length' })
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'S', name: 'height' })
  await api.v1.common.recalc()
  await snapshot('after')

  return { partId, boxId }
}
