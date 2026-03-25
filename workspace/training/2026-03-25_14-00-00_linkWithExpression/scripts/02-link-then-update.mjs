// Link, then update the expression — verify geometry changes
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 60 }] })
  await api.v1.part.cylinder({ id: partId, diameter: 20, height: 80, position: [120, 0, 0] })

  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: 40,
  })).result

  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
  await api.v1.common.recalc()
  await snapshot('linked-h60')

  // Update H to 150
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 150 }] })
  await api.v1.common.recalc()
  await snapshot('updated-h150')

  return { partId, boxId }
}
