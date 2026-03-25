// After unlink, updating the expression should NOT change geometry
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 100 }] })
  await api.v1.part.cylinder({ id: partId, diameter: 20, height: 60, position: [120, 0, 0] })

  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: 40,
  })).result

  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
  await api.v1.common.recalc()
  await snapshot('linked-h100')

  await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
  await api.v1.common.recalc()

  // Update H to 200 — should NOT affect box
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 200 }] })
  await api.v1.common.recalc()
  await snapshot('after-update-h200')

  return { partId, boxId }
}
