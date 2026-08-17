// Link without calling recalc — does anything change?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 120 }] })
  await api.v1.part.cylinder({ id: partId, diameter: 20, height: 80, position: [120, 0, 0] })

  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: 40,
  })).result

  await snapshot('before')
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
  await snapshot('after-link-no-recalc')
  await api.v1.common.recalc()
  await snapshot('after-recalc')

  return { partId, boxId }
}
